import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'
import { EventType, TimelineEventType, UserStats } from '@db'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { BadgesService } from '../badges/BadgesService'
import { UsersService } from '../users/UsersService'
import { DeduplicationService } from '../../common/cache/DeduplicationService'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { deriveLevel, deriveLevelLabel } from '../../common/helpers/scoring/levelHelper'
import { computeStreakUpdate } from '../../common/helpers/scoring/streakHelper'
import { getIsoWeek } from '../../common/helpers/scoring/isoWeekHelper'
import { mapUnlockedBadgesToDisplay } from '../../common/helpers/badges/badgeDisplayHelper'
import { STREAK_MILESTONES } from './constants'
import { QueueName } from '../../common/queues/QueueName'
import { NotificationJobName } from '../../common/queues/JobName'
import { BadgeType } from '@db'
import { ScoringRepository } from './repositories/ScoringRepository'
import { ScoringConfigService } from './ScoringConfigService'
import { CreateEventInput, EventResult } from './ScoringModel'
import type { EventContext } from './ScoringModel'
import type { BadgeResult } from '../badges/IBadgesService'
import type { TxClient } from '../../common/prisma/types'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class ScoringEventProcessor {
  private readonly logger = new Logger(ScoringEventProcessor.name)

  constructor(
    private readonly scoringRepo: ScoringRepository,
    private readonly scoringConfigService: ScoringConfigService,
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
    private readonly dedup: DeduplicationService,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async processEvent(input: CreateEventInput): Promise<EventResult> {
    try {
      await this.usersService.findOrThrow(input.userId)
      const provider = input.provider ?? 'generic'
      const timestamp = new Date(input.timestamp)
      const alreadyProcessed = await this.dedup.isProcessed(input.eventId, provider)

      if (alreadyProcessed) {
        return this.buildDuplicateEventResult(input.eventId)
      }

      const ctx = await this.prepareEventContext(input, provider, timestamp)
      const { stats, badgeResult } = await this.persistScoredEvent(ctx)

      await this.invalidateLeaderboardCache(ctx.isoWeek).catch((error) => {
        this.logger.warn(
          {
            service: ScoringEventProcessor.name,
            method: 'processEvent',
            operation: 'invalidateLeaderboardCache',
            metadata: { eventId: input.eventId, isoWeek: ctx.isoWeek },
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to invalidate leaderboard cache after scoring',
        )
      })

      await this.enqueuePostEventNotifications(ctx, badgeResult).catch((error) => {
        this.logger.warn(
          {
            service: ScoringEventProcessor.name,
            method: 'processEvent',
            operation: 'enqueuePostEventNotifications',
            metadata: { eventId: input.eventId, userId: input.userId },
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          'Failed to enqueue post-event notifications; scoring already persisted',
        )
      })

      return this.buildSuccessEventResult(ctx, stats, badgeResult)
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: ScoringEventProcessor.name,
        method: 'processEvent',
        operation: 'processScoringEvent',
        safeMessage: 'Unable to process scoring event right now.',
        metadata: { eventId: input.eventId, userId: input.userId, eventType: input.eventType },
      })
    }
  }

  private buildDuplicateEventResult(eventId: string): EventResult {
    return {
      eventId,
      accepted: true,
      duplicate: true,
      capReached: false,
      pointsAwarded: 0,
      reason: 'Duplicate eventId — already processed',
      badgesUnlocked: [],
    }
  }

  private async prepareEventContext(
    input: CreateEventInput,
    provider: string,
    timestamp: Date,
  ): Promise<EventContext> {
    const rules = await this.scoringConfigService.getConfig()
    const basePoints = rules.pointRules[input.eventType] ?? 0

    const today = new Date(timestamp)
    today.setHours(0, 0, 0, 0)

    let capReached = false
    const capConfig = rules.dailyCaps[input.eventType]

    if (capConfig?.isActive) {
      const capRow = await this.scoringRepo.findDailyCap(input.userId, input.eventType, today)
      if (capRow && capRow.count >= capConfig.maxCount) {
        capReached = true
      }
    }

    const pointsAwarded = capReached ? 0 : basePoints
    const currentStats = await this.usersService.getStats(input.userId)
    const currentXP = currentStats?.totalXP ?? 0
    const newXP = Math.max(0, currentXP + pointsAwarded)
    const newPoints = newXP
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

    return {
      input,
      provider,
      timestamp,
      rules,
      today,
      capReached,
      capConfig,
      pointsAwarded,
      currentStats,
      newXP,
      newPoints,
      newLevel,
      newLevelLabel,
      levelUp,
      streakUpdate,
      newStreak,
      isoWeek,
    }
  }

  private async persistScoredEvent(ctx: EventContext): Promise<{ stats: UserStats; badgeResult: BadgeResult }> {
    const { input, provider, timestamp, streakUpdate, pointsAwarded, capReached } = ctx

    return this.scoringRepo.runTransaction(async (tx) => {
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
          totalXP: ctx.newXP,
          totalPoints: ctx.newPoints,
          level: ctx.newLevel,
          currentStreak: streakUpdate?.currentStreak ?? 0,
          longestStreak: streakUpdate?.longestStreak ?? 0,
          lastActivityDate: streakUpdate?.lastActivityDate ?? null,
        },
        {
          totalXP: ctx.newXP,
          totalPoints: ctx.newPoints,
          level: ctx.newLevel,
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
        await this.scoringRepo.upsertWeeklyStat(tx, input.userId, ctx.isoWeek, pointsAwarded)
      }

      await this.scoringRepo.upsertDailyCap(tx, input.userId, input.eventType, ctx.today)

      const badgeRes = await this.badgesService.evaluate(
        tx,
        input.userId,
        input.eventType,
        ctx.isoWeek,
        ctx.newStreak,
        timestamp,
      )

      await this.recordTimelineEntries(tx, ctx, badgeRes)

      return { stats: statsData, badgeResult: badgeRes }
    })
  }

  private async recordTimelineEntries(tx: TxClient, ctx: EventContext, badgeResult: BadgeResult) {
    const { input } = ctx

    for (const badge of badgeResult.unlocked) {
      await this.scoringRepo.createTimelineEntry(tx, {
        userId: input.userId,
        type: TimelineEventType.BADGE_EARNED,
        badgeType: badge,
        eventId: input.eventId,
        pointsSnapshot: ctx.newPoints,
        xpSnapshot: ctx.newXP,
        levelSnapshot: ctx.newLevel,
        weekKey: ctx.isoWeek,
      })
    }

    if (ctx.levelUp) {
      await this.scoringRepo.createTimelineEntry(tx, {
        userId: input.userId,
        type: TimelineEventType.LEVEL_UP,
        pointsSnapshot: ctx.newPoints,
        xpSnapshot: ctx.newXP,
        levelSnapshot: ctx.newLevel,
        metadata: { from: ctx.currentStats?.level ?? 1, to: ctx.newLevel },
      })
    }

    if (
      ctx.streakUpdate &&
      STREAK_MILESTONES.includes(ctx.newStreak as (typeof STREAK_MILESTONES)[number])
    ) {
      await this.scoringRepo.createTimelineEntry(tx, {
        userId: input.userId,
        type: TimelineEventType.STREAK_MILESTONE,
        pointsSnapshot: ctx.newPoints,
        xpSnapshot: ctx.newXP,
        levelSnapshot: ctx.newLevel,
        metadata: { streak: ctx.newStreak },
      })
    }
  }

  private async invalidateLeaderboardCache(isoWeek: string) {
    await this.cache.del(CacheKey.leaderboard(isoWeek))
    await this.cache.del(CacheKey.leaderboardAllTime())
  }

  private async enqueuePostEventNotifications(ctx: EventContext, badgeResult: BadgeResult) {
    if (ctx.levelUp) {
      await this.notificationQueue.add(NotificationJobName.LEVEL_UP, {
        userId: ctx.input.userId,
        level: ctx.newLevel,
      })
    }

    for (const badge of badgeResult.unlocked) {
      await this.notificationQueue.add(NotificationJobName.BADGE_UNLOCK, {
        userId: ctx.input.userId,
        badge,
      })
    }
  }

  private buildSuccessEventResult(
    ctx: EventContext,
    stats: UserStats,
    badgeResult: BadgeResult,
  ): EventResult {
    const result: EventResult = {
      eventId: ctx.input.eventId,
      accepted: true,
      duplicate: false,
      capReached: ctx.capReached,
      pointsAwarded: ctx.pointsAwarded,
      user: {
        totalXP: stats.totalXP,
        totalPoints: stats.totalPoints,
        level: stats.level,
        levelLabel: ctx.newLevelLabel,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      },
      badgesUnlocked: mapUnlockedBadgesToDisplay(badgeResult.unlocked),
    }

    if (ctx.capReached && ctx.capConfig) {
      result.reason = `Daily cap reached for ${ctx.input.eventType} (${ctx.capConfig.maxCount}/${ctx.capConfig.maxCount})`
    }

    return result
  }
}
