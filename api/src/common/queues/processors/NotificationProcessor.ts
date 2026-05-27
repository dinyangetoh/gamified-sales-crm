import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { BadgeType } from '@db'
import { NotificationsService } from '../../../modules/notifications/NotificationsService'
import { QueueName } from '../QueueName'
import { NotificationJobName } from '../JobName'

@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name)

  constructor(private readonly notificationsService: NotificationsService) {
    super()
  }

  async process(job: Job): Promise<void> {
    const { userId } = job.data as { userId: string }

    switch (job.name as NotificationJobName) {
      case NotificationJobName.BADGE_UNLOCK:
        await this.notificationsService.sendBadgeUnlock(userId, job.data.badge as BadgeType)
        break

      case NotificationJobName.STREAK_RISK:
        await this.notificationsService.sendStreakRisk(userId, job.data.streak as number)
        break

      case NotificationJobName.LEVEL_UP:
        this.logger.debug({ userId, level: job.data.level }, 'Level-up notification — MVP')
        break

      case NotificationJobName.STREAK_BROKEN:
        this.logger.debug({ userId }, 'Streak broken notification — MVP')
        break

      default:
        this.logger.warn(`Unknown notification job: ${job.name}`)
    }
  }
}
