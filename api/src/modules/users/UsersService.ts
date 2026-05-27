import { Injectable, NotFoundException } from '@nestjs/common'
import { User, UserStats } from '@db'
import { getEventTypeDisplayName } from '../../common/labels/eventTypeLabels'
import { BadgeType } from '@db'
import { getBadgeDefinition } from '../badges/badgeDefinitions'
import { currentIsoWeek } from '../scoring/isoWeekUtils'
import {
  aggregateEarnedBadges,
  aggregateInProgressBadges,
  buildLockedBadges,
} from './badgeProfileAggregation'
import { UsersRepository } from './UsersRepository'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findOrThrow(userId: string): Promise<User> {
    const user = await this.usersRepo.findById(userId)
    if (!user) throw new NotFoundException(`User ${userId} not found`)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email)
  }

  async getStats(userId: string): Promise<UserStats | null> {
    return this.usersRepo.findStats(userId)
  }

  async findUsersAtRisk(yesterday: Date, today: Date) {
    return this.usersRepo.findUsersAtRisk(yesterday, today)
  }

  async listSalesRepSummaries() {
    const users = await this.usersRepo.findSalesReps()
    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      totalXP: u.stats?.totalXP ?? 0,
      level: u.stats?.level ?? 1,
      currentStreak: u.stats?.currentStreak ?? 0,
      longestStreak: u.stats?.longestStreak ?? 0,
      badgeCount: new Set(u.badgeAwards.map((b) => b.badgeType)).size,
      eventCount: (u as any).eventCount ?? 0,
      lastActivityAt: u.stats?.lastActivityDate ?? null,
    }))
  }

  async getProfile(userId: string) {
    const user = await this.findOrThrow(userId)
    const stats = await this.usersRepo.findStats(userId)
    const earned = await this.usersRepo.findBadgeAwards(userId)
    const inProgress = await this.usersRepo.findBadgeProgressInProgress(userId)

    const earnedTypes = new Set(earned.map((b) => b.badgeType))
    const earnedBadges = aggregateEarnedBadges(earned)
    const inProgressBadges = aggregateInProgressBadges(inProgress, currentIsoWeek(), earnedTypes)
    const inProgressTypes = new Set(inProgressBadges.map((b) => b.type as BadgeType))
    const lockedBadges = buildLockedBadges(earnedTypes, inProgressTypes)

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
  }

  async getTimeline(userId: string, limit = 20, offset = 0) {
    const [entries, total] = await this.usersRepo.findTimeline(userId, limit, offset)

    const timeline = entries.map((e) => {
      const badgeDef = e.badgeType ? getBadgeDefinition(e.badgeType) : null
      return {
        id: e.id,
        type: e.type,
        badgeType: e.badgeType,
        displayName: badgeDef?.displayName,
        iconUrl: badgeDef?.iconUrl,
        pointsSnapshot: e.pointsSnapshot,
        xpSnapshot: e.xpSnapshot,
        levelSnapshot: e.levelSnapshot,
        weekKey: e.weekKey,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }
    })

    return { timeline, total, limit, offset }
  }

  async getEventFeed(
    userId: string,
    params: { from?: string; to?: string; limit?: number; offset?: number },
  ) {
    const limit = params.limit ?? 50
    const offset = params.offset ?? 0
    const [events, total] = await this.usersRepo.findEventFeed(userId, { ...params, limit, offset })
    return {
      events: events.map((e) => ({
        ...e,
        eventTypeDisplayName: getEventTypeDisplayName(e.eventType),
      })),
      total,
      limit,
      offset,
    }
  }
}
