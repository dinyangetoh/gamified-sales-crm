import { Injectable } from '@nestjs/common'
import { EventType, TimelineEventType, BadgeType } from '@db'
import { PrismaService } from '../../common/prisma/PrismaService'
import type { TxClient } from '../../common/prisma/types'

@Injectable()
export class ScoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  findScoringRules() {
    return this.prisma.scoringRule.findMany({ where: { isActive: true } })
  }

  findLevelConfigs() {
    return this.prisma.levelConfig.findMany({ orderBy: { minXP: 'asc' } })
  }

  findDailyCapConfigs() {
    return this.prisma.dailyCapConfig.findMany({ where: { isActive: true } })
  }

  findAllScoringRules() {
    return this.prisma.scoringRule.findMany({ orderBy: { eventType: 'asc' } })
  }

  findAllLevelConfigs() {
    return this.prisma.levelConfig.findMany({ orderBy: { level: 'asc' } })
  }

  findAllDailyCapConfigs() {
    return this.prisma.dailyCapConfig.findMany({ orderBy: { eventType: 'asc' } })
  }

  findDailyCap(userId: string, eventType: EventType, date: Date) {
    return this.prisma.dailyCap.findUnique({
      where: { userId_eventType_date: { userId, eventType, date } },
    })
  }

  runTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn)
  }

  createEvent(
    tx: TxClient,
    data: {
      eventId: string
      userId: string
      provider: string
      eventType: EventType
      entityId: string
      rawPayload: object
      pointsAwarded: number
      capReached: boolean
      timestamp: Date
      processedAt: Date
    },
  ) {
    return tx.event.create({ data })
  }

  upsertUserStats(
    tx: TxClient,
    userId: string,
    create: {
      totalXP: number
      totalPoints: number
      level: number
      currentStreak: number
      longestStreak: number
      lastActivityDate: Date | null
    },
    update: {
      totalXP: number
      totalPoints: number
      level: number
      currentStreak?: number
      longestStreak?: number
      lastActivityDate?: Date
    },
  ) {
    return tx.userStats.upsert({
      where: { userId },
      create: { userId, ...create },
      update,
    })
  }

  upsertWeeklyStat(tx: TxClient, userId: string, isoWeek: string, points: number) {
    return tx.weeklyStat.upsert({
      where: { userId_isoWeek: { userId, isoWeek } },
      create: { userId, isoWeek, weekPoints: points },
      update: { weekPoints: { increment: points } },
    })
  }

  upsertDailyCap(tx: TxClient, userId: string, eventType: EventType, date: Date) {
    return tx.dailyCap.upsert({
      where: { userId_eventType_date: { userId, eventType, date } },
      create: { userId, eventType, date, count: 1 },
      update: { count: { increment: 1 } },
    })
  }

  createTimelineEntry(
    tx: TxClient,
    data: {
      userId: string
      type: TimelineEventType
      badgeType?: BadgeType
      eventId?: string
      pointsSnapshot: number
      xpSnapshot: number
      levelSnapshot: number
      weekKey?: string
      metadata?: object
    },
  ) {
    return tx.awardTimeline.create({ data })
  }
}
