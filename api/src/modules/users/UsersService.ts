import { Injectable, NotFoundException } from '@nestjs/common'
import { User, UserStats } from '@db'
import { PrismaService } from '../../common/prisma/PrismaService'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrThrow(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException(`User ${userId} not found`)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async getStats(userId: string): Promise<UserStats | null> {
    return this.prisma.userStats.findUnique({ where: { userId } })
  }

  async getProfile(userId: string) {
    const user = await this.findOrThrow(userId)
    const stats = await this.prisma.userStats.findUnique({ where: { userId } })
    const earned = await this.prisma.badgeAward.findMany({
      where: { userId },
      orderBy: { awardedAt: 'asc' },
    })
    const inProgress = await this.prisma.badgeProgress.findMany({
      where: { userId, isCompleted: false },
    })

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
    const [entries, total] = await Promise.all([
      this.prisma.awardTimeline.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.awardTimeline.count({ where: { userId } }),
    ])

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

    const where = {
      userId,
      ...(params.from || params.to
        ? {
            timestamp: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        select: {
          eventId: true,
          userId: true,
          provider: true,
          eventType: true,
          entityId: true,
          pointsAwarded: true,
          capReached: true,
          timestamp: true,
          createdAt: true,
        },
      }),
      this.prisma.event.count({ where }),
    ])

    return { events, total, limit, offset }
  }
}
