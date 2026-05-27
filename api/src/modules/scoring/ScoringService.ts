import { Inject, Injectable, Logger } from '@nestjs/common'
import { EventType, TimelineEventType } from '@db'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { BadgesService } from '../badges/BadgesService'
import { UsersService } from '../users/UsersService'
import { DeduplicationService } from '../../common/cache/DeduplicationService'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { deriveLevel, deriveLevelLabel } from './levelUtils'
import { computeStreakUpdate } from './streakUtils'
import { getIsoWeek } from './isoWeekUtils'
import { STREAK_MILESTONES, CACHE_TTL_SCORING_CONFIG } from './constants'
import { QueueName } from '../../common/queues/QueueName'
import { NotificationJobName } from '../../common/queues/JobName'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { BadgeType } from '@db'
import { ScoringRepository } from './ScoringRepository'

export interface CreateEventInput {
  eventId: string
  userId: string
  provider?: string
  eventType: EventType
  entityId: string
  timestamp: string | Date
  metadata?: Record<string, unknown>
}

export interface EventResult {
  eventId: string
  accepted: boolean
  duplicate: boolean
  capReached: boolean
  pointsAwarded: number
  reason?: string
  user?: {
    totalXP: number
    totalPoints: number
    level: number
    levelLabel: string
    currentStreak: number
    longestStreak: number
  }
  badgesUnlocked: Array<{ type: BadgeType; displayName: string; iconUrl: string }>
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name)

  constructor(
    private readonly scoringRepo: ScoringRepository,
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
    private readonly dedup: DeduplicationService,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async processEvent(input: CreateEventInput): Promise<EventResult> {
    await this.usersService.findOrThrow(input.userId)
    const provider = input.provider ?? 'generic'
    const timestamp = new Date(input.timestamp)

    const isDuplicate = await this.dedup.isProcessed(input.eventId, provider)
    if (isDuplicate) {
      return {
        eventId: input.eventId,
        accepted: true,
        duplicate: true,
        capReached: false,
        pointsAwarded: 0,
        reason: 'Duplicate eventId — already processed',
        badgesUnlocked: [],
      }
    }

    const rules = await this.getScoringConfig()
    const basePoints = rules.pointRules[input.eventType] ?? 0

    const today = new Date(timestamp)
    today.setHours(0, 0, 0, 0)

    let capReached = false
    const capConfig = rules.dailyCaps[input.eventType]

    if (capConfig?.isActive) {
      const capRow = await this.scoringRepo.findDailyCap(
        input.userId,
        input.eventType,
        today,
      )
      if (capRow && capRow.count >= capConfig.maxCount) {
        capReached = true
      }
    }

    const pointsAwarded = capReached ? 0 : basePoints
    const currentStats = await this.usersService.getStats(input.userId)
    const currentXP = currentStats?.totalXP ?? 0
    const currentPoints = currentStats?.totalPoints ?? 0

    const newXP = Math.max(0, currentXP + pointsAwarded)
    const newPoints = currentPoints + pointsAwarded
    const newLevel = deriveLevel(newXP, rules.levels)
    const newLevelLabel = deriveLevelLabel(newXP, rules.levels)
    const levelUp = newLevel > (currentStats?.level ?? 1)

    const streakUpdate =
      pointsAwarded !== 0
        ? computeStreakUpdate(
            currentStats
              ? {
                  currentStreak: currentStats.currentStreak,
                  longestStreak: currentStats.longestStreak,
                  lastActivityDate: currentStats.lastActivityDate,
                }
              : null,
            timestamp,
          )
        : null

    const newStreak = streakUpdate?.currentStreak ?? currentStats?.currentStreak ?? 0
    const isoWeek = getIsoWeek(timestamp)

    const { stats, badgeResult } = await this.scoringRepo.runTransaction(async (tx) => {
      await this.scoringRepo.createEvent(tx, {
        eventId: input.eventId,
        userId: input.userId,
        provider,
        eventType: input.eventType,
        entityId: input.entityId,
        rawPayload: (input.metadata ?? {}) as object,
        pointsAwarded,
        capReached,
        timestamp,
        processedAt: new Date(),
      })

      const statsData = await this.scoringRepo.upsertUserStats(
        tx,
        input.userId,
        {
          totalXP: newXP,
          totalPoints: newPoints,
          level: newLevel,
          currentStreak: streakUpdate?.currentStreak ?? 0,
          longestStreak: streakUpdate?.longestStreak ?? 0,
          lastActivityDate: streakUpdate?.lastActivityDate ?? null,
        },
        {
          totalXP: newXP,
          totalPoints: newPoints,
          level: newLevel,
          ...(streakUpdate
            ? {
                currentStreak: streakUpdate.currentStreak,
                longestStreak: streakUpdate.longestStreak,
                lastActivityDate: streakUpdate.lastActivityDate,
              }
            : {}),
        },
      )

      if (pointsAwarded !== 0) {
        await this.scoringRepo.upsertWeeklyStat(tx, input.userId, isoWeek, pointsAwarded)
      }

      await this.scoringRepo.upsertDailyCap(tx, input.userId, input.eventType, today)

      const badgeRes = await this.badgesService.evaluate(
        tx,
        input.userId,
        input.eventType,
        isoWeek,
        newStreak,
      )

      for (const badge of badgeRes.unlocked) {
        await this.scoringRepo.createTimelineEntry(tx, {
          userId: input.userId,
          type: TimelineEventType.BADGE_EARNED,
          badgeType: badge,
          eventId: input.eventId,
          pointsSnapshot: newPoints,
          xpSnapshot: newXP,
          levelSnapshot: newLevel,
          weekKey: isoWeek,
        })
      }

      if (levelUp) {
        await this.scoringRepo.createTimelineEntry(tx, {
          userId: input.userId,
          type: TimelineEventType.LEVEL_UP,
          pointsSnapshot: newPoints,
          xpSnapshot: newXP,
          levelSnapshot: newLevel,
          metadata: { from: currentStats?.level ?? 1, to: newLevel },
        })
      }

      if (
        streakUpdate &&
        STREAK_MILESTONES.includes(newStreak as (typeof STREAK_MILESTONES)[number])
      ) {
        await this.scoringRepo.createTimelineEntry(tx, {
          userId: input.userId,
          type: TimelineEventType.STREAK_MILESTONE,
          pointsSnapshot: newPoints,
          xpSnapshot: newXP,
          levelSnapshot: newLevel,
          metadata: { streak: newStreak },
        })
      }

      return { stats: statsData, badgeResult: badgeRes }
    })

    await this.cache.del(CacheKey.leaderboard(isoWeek))
    await this.cache.del(CacheKey.leaderboardAllTime())

    if (levelUp) {
      await this.notificationQueue.add(NotificationJobName.LEVEL_UP, {
        userId: input.userId,
        level: newLevel,
      })
    }

    for (const badge of badgeResult.unlocked) {
      await this.notificationQueue.add(NotificationJobName.BADGE_UNLOCK, {
        userId: input.userId,
        badge,
      })
    }

    const { BADGE_DEFINITIONS } = await import('../badges/badgeDefinitions')
    const badgesUnlocked = badgeResult.unlocked.map((type) => {
      const def = BADGE_DEFINITIONS.find((d) => d.type === type)!
      return { type, displayName: def.displayName, iconUrl: def.iconUrl }
    })

    const result: EventResult = {
      eventId: input.eventId,
      accepted: true,
      duplicate: false,
      capReached,
      pointsAwarded,
      user: {
        totalXP: stats.totalXP,
        totalPoints: stats.totalPoints,
        level: stats.level,
        levelLabel: newLevelLabel,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      },
      badgesUnlocked,
    }

    if (capReached) {
      result.reason = `Daily cap reached for ${input.eventType}`
    }

    return result
  }

  private async getScoringConfig(): Promise<ScoringConfig> {
    const cached = await this.cache.get<ScoringConfig>(CacheKey.scoringConfig())
    if (cached) return cached

    const [scoringRules, levelConfigs, capConfigs] = await Promise.all([
      this.scoringRepo.findScoringRules(),
      this.scoringRepo.findLevelConfigs(),
      this.scoringRepo.findDailyCapConfigs(),
    ])

    const config: ScoringConfig = {
      pointRules: Object.fromEntries(scoringRules.map((r) => [r.eventType, r.points])),
      dailyCaps: Object.fromEntries(
        capConfigs.map((c) => [c.eventType, { maxCount: c.maxCount, isActive: c.isActive }]),
      ),
      levels: levelConfigs.map((l) => ({ level: l.level, minXP: l.minXP, label: l.label })),
    }

    await this.cache.set(CacheKey.scoringConfig(), config, CACHE_TTL_SCORING_CONFIG)
    return config
  }
}
