import { Injectable, NotFoundException } from '@nestjs/common'
import { User, UserStats } from '@db'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
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
      badgeCount: u.badgeAwards.length,
    }))
  }

  async getProfile(userId: string) {
    const user = await this.findOrThrow(userId)
    const stats = await this.usersRepo.findStats(userId)
    const earned = await this.usersRepo.findBadgeAwards(userId)
    const inProgress = await this.usersRepo.findBadgeProgressInProgress(userId)

    const earnedSet = new Set(earned.map((b) => b.badgeType))
    const inProgressSet = new Set(inProgress.map((b) => b.badgeType))

    const earnedBadges = earned.map((b) => {
      const def = BADGE_DEFINITIONS.find((d) => d.type === b.badgeType)!
      return {
        type: b.badgeType,
        displayName: def.displayName,
        description: def.description,
        iconUrl: def.iconUrl,
        awardedAt: b.awardedAt,
      }
    })

    const inProgressBadges = inProgress.map((p) => {
      const def = BADGE_DEFINITIONS.find((d) => d.type === p.badgeType)!
      return {
        type: p.badgeType,
        displayName: def.displayName,
        description: def.description,
        iconUrl: def.iconUrl,
        currentCount: p.currentCount,
        targetCount: p.targetCount,
        progressPercent: Math.round((p.currentCount / p.targetCount) * 100),
        weekKey: p.weekKey,
      }
    })

    const lockedBadges = BADGE_DEFINITIONS.filter(
      (d) => !earnedSet.has(d.type) && !inProgressSet.has(d.type),
    ).map((d) => ({
      type: d.type,
      displayName: d.displayName,
      description: d.description,
      iconUrl: d.iconUrl,
      locked: true,
    }))

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
      const badgeDef = e.badgeType
        ? BADGE_DEFINITIONS.find((d) => d.type === e.badgeType)
        : null
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
    return { events, total, limit, offset }
  }
}
