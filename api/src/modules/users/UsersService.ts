import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { User, UserStats, BadgeType } from '@db'
import { getEventTypeDisplayName } from '../../common/labels/eventTypeLabels'
import { BADGE_DEFINITIONS, BadgeRepeatPolicy, getBadgeDefinition } from '../badges/badgeDefinitions'
import { currentIsoWeek } from '../../common/helpers/scoring/isoWeekHelper'
import { UsersRepository } from './UsersRepository'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'
import type {
  BadgeAwardRow,
  BadgeProgressRow,
  EventFeedResult,
  SalesRepSummary,
  TimelineResult,
  UserProfileResult,
  UserEventFeedParams,
} from './IUsersService'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly usersRepo: UsersRepository) {}

  async findOrThrow(userId: string): Promise<User> {
    try {
      const user = await this.usersRepo.findById(userId)
      if (!user) throw new NotFoundException(`User ${userId} not found`)
      return user
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'findOrThrow',
        operation: 'findUserById',
        safeMessage: 'Unable to load user profile right now.',
        metadata: { userId },
      })
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.usersRepo.findByEmail(email)
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'findByEmail',
        operation: 'findUserByEmail',
        safeMessage: 'Unable to resolve user credentials right now.',
        metadata: { email },
      })
    }
  }

  async getStats(userId: string): Promise<UserStats | null> {
    try {
      return await this.usersRepo.findStats(userId)
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'getStats',
        operation: 'findUserStats',
        safeMessage: 'Unable to load user stats right now.',
        metadata: { userId },
      })
    }
  }

  async findUsersAtRisk(yesterday: Date, today: Date): ReturnType<UsersRepository['findUsersAtRisk']> {
    try {
      return await this.usersRepo.findUsersAtRisk(yesterday, today)
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'findUsersAtRisk',
        operation: 'findUsersAtRisk',
        safeMessage: 'Unable to load at-risk users right now.',
        metadata: { yesterday: yesterday.toISOString(), today: today.toISOString() },
      })
    }
  }

  async listSalesRepSummaries(): Promise<SalesRepSummary[]> {
    try {
      const salesRepUsers = await this.usersRepo.findSalesReps()
      return salesRepUsers.map((salesRepUser) => ({
        userId: salesRepUser.id,
        name: salesRepUser.name,
        email: salesRepUser.email,
        totalXP: salesRepUser.stats?.totalXP ?? 0,
        level: salesRepUser.stats?.level ?? 1,
        currentStreak: salesRepUser.stats?.currentStreak ?? 0,
        longestStreak: salesRepUser.stats?.longestStreak ?? 0,
        badgeCount: new Set(salesRepUser.badgeAwards.map((badgeAward) => badgeAward.badgeType)).size,
        eventCount: salesRepUser.eventCount ?? 0,
        lastActivityAt: salesRepUser.stats?.lastActivityDate ?? null,
      }))
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'listSalesRepSummaries',
        operation: 'buildSalesRepSummaries',
        safeMessage: 'Unable to load sales rep summaries right now.',
      })
    }
  }

  async getProfile(userId: string): Promise<UserProfileResult> {
    try {
      const user = await this.findOrThrow(userId)
      const stats = await this.usersRepo.findStats(userId)
      const earned = await this.usersRepo.findBadgeAwards(userId)
      const inProgress = await this.usersRepo.findBadgeProgressInProgress(userId)

      const earnedBadgeTypes = new Set(earned.map((badgeAward) => badgeAward.badgeType))
      const earnedBadges = this.aggregateEarnedBadges(earned)
      const inProgressBadges = this.aggregateInProgressBadges(
        inProgress,
        currentIsoWeek(),
        earnedBadgeTypes,
      )
      const inProgressBadgeTypes = new Set(
        inProgressBadges.map((inProgressBadge) => inProgressBadge.type as BadgeType),
      )
      const lockedBadges = this.buildLockedBadges(earnedBadgeTypes, inProgressBadgeTypes)

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        stats: stats
          ? {
              totalXP: stats.totalXP,
              totalPoints: stats.totalPoints,
              level: stats.level,
              currentStreak: stats.currentStreak,
              longestStreak: stats.longestStreak,
            }
          : null,
        badges: { earned: earnedBadges, inProgress: inProgressBadges, locked: lockedBadges },
      }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'getProfile',
        operation: 'assembleUserProfile',
        safeMessage: 'Unable to load user profile right now.',
        metadata: { userId },
      })
    }
  }

  async getTimeline(userId: string, limit = 20, offset = 0): Promise<TimelineResult> {
    try {
      const [entries, total] = await this.usersRepo.findTimeline(userId, limit, offset)

      const timeline = entries.map((timelineEntry) => {
        const badgeDefinition = timelineEntry.badgeType
          ? getBadgeDefinition(timelineEntry.badgeType)
          : null
      return {
          id: timelineEntry.id,
          type: timelineEntry.type,
          badgeType: timelineEntry.badgeType,
          displayName: badgeDefinition?.displayName,
          iconUrl: badgeDefinition?.iconUrl,
          pointsSnapshot: timelineEntry.pointsSnapshot,
          xpSnapshot: timelineEntry.xpSnapshot,
          levelSnapshot: timelineEntry.levelSnapshot,
          weekKey: timelineEntry.weekKey,
          metadata: timelineEntry.metadata,
          createdAt: timelineEntry.createdAt,
        }
      }
      )

      return { timeline, total, limit, offset }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'getTimeline',
        operation: 'fetchUserTimeline',
        safeMessage: 'Unable to load user timeline right now.',
        metadata: { userId, limit, offset },
      })
    }
  }

  async getEventFeed(
    userId: string,
    params: UserEventFeedParams,
  ): Promise<EventFeedResult> {
    try {
      const limit = params.limit ?? 50
      const offset = params.offset ?? 0
      const [events, total] = await this.usersRepo.findEventFeed(userId, { ...params, limit, offset })
      return {
        events: events.map((eventRecord) => ({
          ...eventRecord,
          eventTypeDisplayName: getEventTypeDisplayName(eventRecord.eventType),
        })),
        total,
        limit,
        offset,
      }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: UsersService.name,
        method: 'getEventFeed',
        operation: 'fetchUserEventFeed',
        safeMessage: 'Unable to load user event feed right now.',
        metadata: { userId, params },
      })
    }
  }

  private aggregateEarnedBadges(awards: BadgeAwardRow[]) {
    const byType = new Map<BadgeType, BadgeAwardRow[]>()

    for (const award of awards) {
      const list = byType.get(award.badgeType) ?? []
      list.push(award)
      byType.set(award.badgeType, list)
    }

    return Array.from(byType.entries()).map(([badgeType, badgeAwardRows]) => {
      const badgeDefinition = getBadgeDefinition(badgeType)!
      const latestBadgeAward = badgeAwardRows.reduce((currentLatest, nextAward) =>
        currentLatest.awardedAt > nextAward.awardedAt ? currentLatest : nextAward,
      )
      return {
        type: badgeType,
        displayName: badgeDefinition.displayName,
        description: badgeDefinition.description,
        iconUrl: badgeDefinition.iconUrl,
        awardCount: badgeAwardRows.length,
        latestAwardedAt: latestBadgeAward.awardedAt,
        awardedAt: latestBadgeAward.awardedAt,
      }
    })
  }

  private aggregateInProgressBadges(
    progressRows: BadgeProgressRow[],
    week: string,
    earnedTypes: Set<BadgeType>,
  ) {
    const byType = new Map<BadgeType, BadgeProgressRow>()

    for (const row of progressRows) {
      const badgeDefinition = getBadgeDefinition(row.badgeType)
      if (
        badgeDefinition?.repeatPolicy === BadgeRepeatPolicy.ONCE &&
        earnedTypes.has(row.badgeType)
      ) {
        continue
      }

      const existing = byType.get(row.badgeType)
      if (!existing) {
        byType.set(row.badgeType, row)
        continue
      }

      byType.set(row.badgeType, this.pickPreferredProgressRow(existing, row, week))
    }

    return Array.from(byType.values()).map((badgeProgress) => {
      const badgeDefinition = getBadgeDefinition(badgeProgress.badgeType)!
      return {
        type: badgeProgress.badgeType,
        displayName: badgeDefinition.displayName,
        description: badgeDefinition.description,
        iconUrl: badgeDefinition.iconUrl,
        currentCount: badgeProgress.currentCount,
        targetCount: badgeProgress.targetCount,
        progressPercent: Math.round((badgeProgress.currentCount / badgeProgress.targetCount) * 100),
        weekKey: badgeProgress.weekKey,
      }
    })
  }

  private pickPreferredProgressRow(a: BadgeProgressRow, b: BadgeProgressRow, week: string) {
    if (a.weekKey === week) return a
    if (b.weekKey === week) return b
    const aRatio = a.currentCount / a.targetCount
    const bRatio = b.currentCount / b.targetCount
    if (aRatio !== bRatio) return aRatio > bRatio ? a : b
    return a.updatedAt > b.updatedAt ? a : b
  }

  private buildLockedBadges(earnedTypes: Set<BadgeType>, inProgressTypes: Set<BadgeType>) {
    return BADGE_DEFINITIONS.filter(
      (badgeDefinition) =>
        !earnedTypes.has(badgeDefinition.type) && !inProgressTypes.has(badgeDefinition.type),
    ).map((badgeDefinition) => ({
      type: badgeDefinition.type,
      displayName: badgeDefinition.displayName,
      description: badgeDefinition.description,
      iconUrl: badgeDefinition.iconUrl,
      locked: true,
    }))
  }
}
