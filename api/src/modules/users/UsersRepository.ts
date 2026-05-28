import { Injectable } from '@nestjs/common'
import { Role } from '@db'
import { PrismaService } from '../../common/prisma/PrismaService'
import { addWeeks, startOfISOWeek } from 'date-fns'
import type {
  BadgeAwardRows,
  BadgeProgressRows,
  EventFeedParams,
  EventFeedResult,
  EventFeedWhere,
  GroupedEventCount,
  TimelineResult,
  UserRowOrNull,
  UserStatsRowOrNull,
  UserStatsWithUserRows,
  SalesRepWithStatsAndBadges,
} from './UsersModel'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserRowOrNull> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<UserRowOrNull> {
    return this.prisma.user.findUnique({ where: { email } })
  }

  findStats(userId: string): Promise<UserStatsRowOrNull> {
    return this.prisma.userStats.findUnique({ where: { userId } })
  }

  findBadgeAwards(userId: string): Promise<BadgeAwardRows> {
    return this.prisma.badgeAward.findMany({
      where: { userId },
      orderBy: { awardedAt: 'asc' },
    })
  }

  findBadgeProgressInProgress(userId: string): Promise<BadgeProgressRows> {
    return this.prisma.badgeProgress.findMany({
      where: { userId, isCompleted: false },
      orderBy: { updatedAt: 'desc' },
    })
  }

  findTimeline(userId: string, limit: number, offset: number): Promise<TimelineResult> {
    return Promise.all([
      this.prisma.awardTimeline.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.awardTimeline.count({ where: { userId } }),
    ])
  }

  findEventFeed(userId: string, params: EventFeedParams): Promise<EventFeedResult> {
    const limit = params.limit ?? 50
    const offset = params.offset ?? 0
    const where: EventFeedWhere = {
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
    return Promise.all([
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
  }

  findSalesReps(): Promise<SalesRepWithStatsAndBadges[]> {
    const now = new Date()
    const weekStart = startOfISOWeek(now)
    const weekEnd = addWeeks(weekStart, 1)

    return Promise.all([
      this.prisma.user.findMany({
        where: { role: Role.SALES_REP },
        include: { stats: true, badgeAwards: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.event.groupBy({
        by: ['userId'],
        where: {
          timestamp: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
        _count: { _all: true },
      }),
    ]).then(([users, counts]) => {
      const eventCountByUserId = new Map((counts as GroupedEventCount[]).map((c) => [c.userId, c._count._all]))
      return users.map((u) => ({
        ...u,
        eventCount: eventCountByUserId.get(u.id) ?? 0,
      }))
    })
  }

  findUsersAtRisk(yesterday: Date, today: Date): Promise<UserStatsWithUserRows> {
    return this.prisma.userStats.findMany({
      where: {
        lastActivityDate: { gte: yesterday, lt: today },
        currentStreak: { gte: 2 },
      },
      include: { user: true },
    })
  }
}
