import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/PrismaService'
import type {
  CreateNotificationLogInput,
  NotificationLogRow,
  NotificationLogRowOrNull,
  NotificationLogsQuery,
  NotificationLogsResult,
  NotificationLogsWhere,
  UserRowOrNull,
} from './NotificationsModel'

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string): Promise<UserRowOrNull> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  createNotificationLog(data: CreateNotificationLogInput): Promise<NotificationLogRow> {
    return this.prisma.notificationLog.create({ data })
  }

  findNotificationToday(
    userId: string,
    type: string,
    from: Date,
    to: Date,
  ): Promise<NotificationLogRowOrNull> {
    return this.prisma.notificationLog.findFirst({
      where: { userId, type, sentAt: { gte: from, lt: to } },
    })
  }

  findNotificationLogs(params: NotificationLogsQuery): Promise<NotificationLogsResult> {
    const where: NotificationLogsWhere = {}
    if (params.type) Object.assign(where, { type: params.type })

    if (params.from || params.to) {
      Object.assign(where, {
        sentAt: {
          ...(params.from ? { gte: params.from } : {}),
          ...(params.to ? { lte: params.to } : {}),
        },
      })
    }

    return Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: params.offset,
        take: params.limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.notificationLog.count({
        where,
      }),
    ])
  }
}
