import { Injectable } from '@nestjs/common'
import { EventType, TimelineEventType, BadgeType } from '@db'
import { PrismaService } from '../../../common/prisma/PrismaService'
import type { TxClient } from '../../../common/prisma/types'
import type {
  DailyCapUpsertRow,
  CreateEventData,
  CreateTimelineEntryData,
  DailyCapRow,
  EventRow,
  TimelineRow,
  UpsertUserStatsCreateData,
  UpsertUserStatsUpdateData,
  UserStatsRow,
  WeeklyStatRow,
} from './ScoringRepositoryModel'

@Injectable()
export class ScoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDailyCap(userId: string, eventType: EventType, date: Date): Promise<DailyCapRow> {
    return this.prisma.dailyCap.findUnique({
      where: { userId_eventType_date: { userId, eventType, date } },
    })
  }

  runTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn)
  }

  createEvent(
    tx: TxClient,
    data: CreateEventData,
  ): Promise<EventRow> {
    return tx.event.create({ data })
  }

  upsertUserStats(
    tx: TxClient,
    userId: string,
    create: UpsertUserStatsCreateData,
    update: UpsertUserStatsUpdateData,
  ): Promise<UserStatsRow> {
    return tx.userStats.upsert({
      where: { userId },
      create: { userId, ...create },
      update,
    })
  }

  upsertWeeklyStat(
    tx: TxClient,
    userId: string,
    isoWeek: string,
    points: number,
  ): Promise<WeeklyStatRow> {
    return tx.weeklyStat.upsert({
      where: { userId_isoWeek: { userId, isoWeek } },
      create: { userId, isoWeek, weekPoints: points },
      update: { weekPoints: { increment: points } },
    })
  }

  upsertDailyCap(
    tx: TxClient,
    userId: string,
    eventType: EventType,
    date: Date,
  ): Promise<DailyCapUpsertRow> {
    return tx.dailyCap.upsert({
      where: { userId_eventType_date: { userId, eventType, date } },
      create: { userId, eventType, date, count: 1 },
      update: { count: { increment: 1 } },
    })
  }

  createTimelineEntry(
    tx: TxClient,
    data: CreateTimelineEntryData,
  ): Promise<TimelineRow> {
    return tx.awardTimeline.create({ data })
  }
}
