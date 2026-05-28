import type { Prisma } from '@db'

export type WeeklyStatsRow = Prisma.WeeklyStatGetPayload<{
  include: { user: { include: { stats: true; badgeAwards: true } } }
}>

export type AllTimeStatsRow = Prisma.UserStatsGetPayload<{
  include: { user: { include: { badgeAwards: true } } }
}>
