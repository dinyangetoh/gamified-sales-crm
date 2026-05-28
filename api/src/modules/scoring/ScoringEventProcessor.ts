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
    private readonly scoringRepository: ScoringRepository,
    private readonly scoringConfigService: ScoringConfigService,
    private readonly badgesService: BadgesService,
    private readonly usersService: UsersService,
    private readonly deduplicationService: DeduplicationService,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async processEvent(input: CreateEventInput): Promise<EventResult> {
    try {
      await this.usersService.findOrThrow(input.userId)
      const provider = input.provider ?? 'generic'
      const timestamp = new Date(input.timestamp)
      const alreadyProcessed = await this.deduplicationService.isProcessed(input.eventId, provider)

      if (alreadyProcessed) {
        return this.buildDuplicateEventResult(input.eventId)
      }

      const eventContext = await this.prepareEventContext(input, provider, timestamp)
      const { stats, badgeResult } = await this.persistScoredEvent(eventContext)

      this.runInBackground(
        'invalidateLeaderboardCache',
        this.invalidateLeaderboardCache(eventContext.isoWeek),
        { isoWeek: eventContext.isoWeek, eventId: input.eventId, userId: input.userId },
      )

      this.runInBackground(
        'enqueuePostEventNotifications',
        this.enqueuePostEventNotifications(eventContext, badgeResult),
        { isoWeek: eventContext.isoWeek, eventId: input.eventId, userId: input.userId },
      )

      return this.buildSuccessEventResult(eventContext, stats, badgeResult)
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
      const capRow = await this.scoringRepository.findDailyCap(input.userId, input.eventType, today)
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

  private async persistScoredEvent(eventContext: EventContext): Promise<{ stats: UserStats; badgeResult: BadgeResult }> {
    const { input, provider, timestamp, streakUpdate, pointsAwarded, capReached } = eventContext

    return this.scoringRepository.runTransaction(async (txClient) => {
      await this.scoringRepository.createEvent(txClient, {
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

      const statsData = await this.scoringRepository.upsertUserStats(
        txClient,
        input.userId,
        {
          totalXP: eventContext.newXP,
          totalPoints: eventContext.newPoints,
          level: eventContext.newLevel,
          currentStreak: streakUpdate?.currentStreak ?? 0,
          longestStreak: streakUpdate?.longestStreak ?? 0,
          lastActivityDate: streakUpdate?.lastActivityDate ?? null,
        },
        {
          totalXP: eventContext.newXP,
          totalPoints: eventContext.newPoints,
          level: eventContext.newLevel,
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
        await this.scoringRepository.upsertWeeklyStat(
          txClient,
          input.userId,
          eventContext.isoWeek,
          pointsAwarded,
        )
      }

      await this.scoringRepository.upsertDailyCap(
        txClient,
        input.userId,
        input.eventType,
        eventContext.today,
      )

      const badgeResult = await this.badgesService.evaluate(
        txClient,
        input.userId,
        input.eventType,
        eventContext.isoWeek,
        eventContext.newStreak,
        timestamp,
      )

      await this.recordTimelineEntries(txClient, eventContext, badgeResult)

      return { stats: statsData, badgeResult }
    })
  }

  private async recordTimelineEntries(txClient: TxClient, eventContext: EventContext, badgeResult: BadgeResult) {
    const { input } = eventContext

    for (const unlockedBadgeType of badgeResult.unlocked) {
      await this.scoringRepository.createTimelineEntry(txClient, {
        userId: input.userId,
        type: TimelineEventType.BADGE_EARNED,
        badgeType: unlockedBadgeType,
        eventId: input.eventId,
        pointsSnapshot: eventContext.newPoints,
        xpSnapshot: eventContext.newXP,
        levelSnapshot: eventContext.newLevel,
        weekKey: eventContext.isoWeek,
      })
    }

    if (eventContext.levelUp) {
      await this.scoringRepository.createTimelineEntry(txClient, {
        userId: input.userId,
        type: TimelineEventType.LEVEL_UP,
        pointsSnapshot: eventContext.newPoints,
        xpSnapshot: eventContext.newXP,
        levelSnapshot: eventContext.newLevel,
        metadata: { from: eventContext.currentStats?.level ?? 1, to: eventContext.newLevel },
      })
    }

    if (
      eventContext.streakUpdate &&
      STREAK_MILESTONES.includes(eventContext.newStreak as (typeof STREAK_MILESTONES)[number])
    ) {
      await this.scoringRepository.createTimelineEntry(txClient, {
        userId: input.userId,
        type: TimelineEventType.STREAK_MILESTONE,
        pointsSnapshot: eventContext.newPoints,
        xpSnapshot: eventContext.newXP,
        levelSnapshot: eventContext.newLevel,
        metadata: { streak: eventContext.newStreak },
      })
    }
  }

  private async invalidateLeaderboardCache(isoWeek: string) {
    await this.cache.del(CacheKey.leaderboard(isoWeek))
    await this.cache.del(CacheKey.leaderboardAllTime())
  }

  private async enqueuePostEventNotifications(eventContext: EventContext, badgeResult: BadgeResult) {
    if (eventContext.levelUp) {
      await this.notificationQueue.add(NotificationJobName.LEVEL_UP, {
        userId: eventContext.input.userId,
        level: eventContext.newLevel,
      })
    }

    for (const unlockedBadgeType of badgeResult.unlocked) {
      await this.notificationQueue.add(NotificationJobName.BADGE_UNLOCK, {
        userId: eventContext.input.userId,
        badge: unlockedBadgeType,
      })
    }
  }

  private runInBackground(
    operation: string,
    task: Promise<unknown>,
    metadata?: Record<string, unknown>,
  ): void {
    void task.catch((error) => {
      this.logger.warn(
        {
          service: ScoringEventProcessor.name,
          method: 'processEvent',
          operation,
          metadata,
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        'Non-blocking side effect failed',
      )
    })
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
