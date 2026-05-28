import type { BadgeType, EventType, UserStats } from '@db'
import type { ScoringConfig } from '../../common/config/scoringConfig.schema'
import type { computeStreakUpdate } from '../../common/helpers/scoring/streakHelper'

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

export type StreakUpdate = ReturnType<typeof computeStreakUpdate>

export interface EventContext {
  input: CreateEventInput
  provider: string
  timestamp: Date
  rules: ScoringConfig
  today: Date
  capReached: boolean
  capConfig: ScoringConfig['dailyCaps'][EventType] | undefined
  pointsAwarded: number
  currentStats: UserStats | null
  newXP: number
  newPoints: number
  newLevel: number
  newLevelLabel: string
  levelUp: boolean
  streakUpdate: StreakUpdate
  newStreak: number
  isoWeek: string
}
