import { BadgeType, EventType } from '@db'

export interface CreateEventInput {
  eventId: string
  userId: string
  provider?: string
  eventType: EventType
  entityId: string
  timestamp: string | Date
  metadata?: Record<string, unknown>
}

export interface EventResult {
  eventId: string
  accepted: boolean
  duplicate: boolean
  capReached: boolean
  pointsAwarded: number
  reason?: string
  user?: {
    totalXP: number
    totalPoints: number
    level: number
    levelLabel: string
    currentStreak: number
    longestStreak: number
  }
  badgesUnlocked: Array<{ type: BadgeType; displayName: string; iconUrl: string }>
}
