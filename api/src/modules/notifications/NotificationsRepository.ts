import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/PrismaService'

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  createNotificationLog(data: {
    userId: string
    type: string
    metadata?: object
  }) {
    return this.prisma.notificationLog.create({ data })
  }

  findNotificationToday(userId: string, type: string, from: Date, to: Date) {
    return this.prisma.notificationLog.findFirst({
      where: { userId, type, sentAt: { gte: from, lt: to } },
    })
  }

  findNotificationLogs(params: {
    type?: string
    from?: Date
    to?: Date
    limit: number
    offset: number
  }): Promise<
    [
      Array<{
        id: string
        userId: string
        type: string
        sentAt: Date
        metadata: unknown
        user?: { name: string; email: string }
      }>,
      number
    ]
  > {
    const where: Record<string, unknown> = {}
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
        where: where as never,
        orderBy: { sentAt: 'desc' },
        skip: params.offset,
        take: params.limit,
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.notificationLog.count({
        where: where as never,
      }),
    ])
  }
}
