import type { Prisma } from '@db'

export type CreateNotificationLogInput = {
  userId: string
  type: string
  metadata?: object
}

export type NotificationLogsQuery = {
  type?: string
  from?: Date
  to?: Date
  limit: number
  offset: number
}

export type NotificationLogsWhere = Prisma.NotificationLogWhereInput

export type NotificationLogWithUser = Prisma.NotificationLogGetPayload<{
  include: { user: { select: { name: true; email: true } } }
}>

export type NotificationLogsResult = [NotificationLogWithUser[], number]
export type UserRowOrNull = Prisma.UserGetPayload<Record<string, never>> | null
export type NotificationLogRow = Prisma.NotificationLogGetPayload<Record<string, never>>
export type NotificationLogRowOrNull = NotificationLogRow | null
