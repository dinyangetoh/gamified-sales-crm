import type { Prisma, Role } from '@db'

export type EventFeedParams = { from?: string; to?: string; limit?: number; offset?: number }

export type EventFeedWhere = Prisma.EventWhereInput

export type EventFeedItem = Prisma.EventGetPayload<{
  select: {
    eventId: true
    userId: true
    provider: true
    eventType: true
    entityId: true
    pointsAwarded: true
    capReached: true
    timestamp: true
    createdAt: true
  }
}>

export type EventFeedResult = [EventFeedItem[], number]

export type UserRowOrNull = Prisma.UserGetPayload<Record<string, never>> | null
export type UserStatsRowOrNull = Prisma.UserStatsGetPayload<Record<string, never>> | null
export type BadgeAwardRows = Prisma.BadgeAwardGetPayload<Record<string, never>>[]
export type BadgeProgressRows = Prisma.BadgeProgressGetPayload<Record<string, never>>[]
export type TimelineRows = Prisma.AwardTimelineGetPayload<Record<string, never>>[]
export type TimelineResult = [TimelineRows, number]

export type SalesRepWithStatsAndBadges = Prisma.UserGetPayload<{
  include: { stats: true; badgeAwards: true }
}> & { eventCount: number }

export type GroupedEventCount = {
  userId: string
  _count: { _all: number }
}

export type SalesRepRole = Extract<Role, 'SALES_REP'>

export type UserStatsWithUserRows = Prisma.UserStatsGetPayload<{ include: { user: true } }>[]
