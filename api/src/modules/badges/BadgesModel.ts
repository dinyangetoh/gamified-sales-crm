import type { BadgeType, Prisma } from '@db'

export type BadgeProgressUpdateInput = { currentCount?: number; isCompleted?: boolean }

export type BadgeProgressCreateInput = {
  userId: string
  badgeType: BadgeType
  currentCount: number
  targetCount: number
  weekKey: string | null
}

export type BadgeProgressRow = Prisma.BadgeProgressGetPayload<Record<string, never>>
export type BadgeProgressRowOrNull = BadgeProgressRow | null
export type BadgeAwardRow = Prisma.BadgeAwardGetPayload<Record<string, never>>
export type BadgeAwardRows = BadgeAwardRow[]
