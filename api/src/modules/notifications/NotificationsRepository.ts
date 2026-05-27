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
}
