import type { BadgeType } from '@db'
import type { EventFeedParams } from './UsersModel'

export type BadgeAwardRow = { badgeType: BadgeType; awardedAt: Date; weekKey?: string | null }

export type BadgeProgressRow = {
  badgeType: BadgeType
  currentCount: number
  targetCount: number
  weekKey: string | null
  updatedAt: Date
}

export type SalesRepSummary = {
  userId: string
  name: string
  email: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  badgeCount: number
  eventCount: number
  lastActivityAt: Date | null
}

export type UserEventFeedParams = EventFeedParams

export type UserProfileResult = {
  userId: string
  name: string
  email: string
  role: string
  stats: {
    totalXP: number
    totalPoints: number
    level: number
    currentStreak: number
    longestStreak: number
  } | null
  badges: {
    earned: Array<Record<string, unknown>>
    inProgress: Array<Record<string, unknown>>
    locked: Array<Record<string, unknown>>
  }
}

export type TimelineResult = {
  timeline: Array<Record<string, unknown>>
  total: number
  limit: number
  offset: number
}

export type EventFeedResult = {
  events: Array<Record<string, unknown>>
  total: number
  limit: number
  offset: number
}
