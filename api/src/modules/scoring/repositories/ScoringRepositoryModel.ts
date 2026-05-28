import type { BadgeType, EventType, Prisma, TimelineEventType } from '@db'

export type CreateEventData = {
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
}

export type UpsertUserStatsCreateData = {
  totalXP: number
  totalPoints: number
  level: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: Date | null
}

export type UpsertUserStatsUpdateData = {
  totalXP: number
  totalPoints: number
  level: number
  currentStreak?: number
  longestStreak?: number
  lastActivityDate?: Date
}

export type CreateTimelineEntryData = {
  userId: string
  type: TimelineEventType
  badgeType?: BadgeType
  eventId?: string
  pointsSnapshot: number
  xpSnapshot: number
  levelSnapshot: number
  weekKey?: string
  metadata?: object
}

export type DailyCapRow = Prisma.DailyCapGetPayload<Record<string, never>> | null
export type UserStatsRow = Prisma.UserStatsGetPayload<Record<string, never>>
export type EventRow = Prisma.EventGetPayload<Record<string, never>>
export type WeeklyStatRow = Prisma.WeeklyStatGetPayload<Record<string, never>>
export type DailyCapUpsertRow = Prisma.DailyCapGetPayload<Record<string, never>>
export type TimelineRow = Prisma.AwardTimelineGetPayload<Record<string, never>>
