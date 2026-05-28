import type { BadgeType } from '@db'

export type LeaderboardBadgeSummary = {
  type: BadgeType
  displayName: string
  iconUrl: string
}

export type WeeklyLeaderboardEntry = {
  rank: number
  userId: string
  name: string
  weekPoints: number
  totalXP: number
  level: number
  levelLabel: string
  currentStreak: number
  pointsGap: number
  lastWeekRank?: number
  rankDelta?: number
  badges: LeaderboardBadgeSummary[]
}

export type AllTimeLeaderboardEntry = {
  rank: number
  userId: string
  name: string
  totalXP: number
  totalPoints: number
  level: number
  levelLabel: string
  currentStreak: number
  pointsGap: number
  badges: LeaderboardBadgeSummary[]
}

export type WeeklyLeaderboardResult = {
  week: string
  generatedAt: Date
  fromCache: boolean
  entries: WeeklyLeaderboardEntry[]
}

export type AllTimeLeaderboardResult = {
  generatedAt: Date
  fromCache: boolean
  entries: AllTimeLeaderboardEntry[]
}
