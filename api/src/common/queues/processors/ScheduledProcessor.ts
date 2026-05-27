import { Processor, WorkerHost } from '@nestjs/bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job, Queue } from 'bullmq'
import { subDays, startOfDay } from 'date-fns'
import { UsersService } from '../../../modules/users/UsersService'
import { NotificationsService } from '../../../modules/notifications/NotificationsService'
import { QueueName } from '../QueueName'
import { NotificationJobName, ScheduledJobName } from '../JobName'

@Processor(QueueName.SCHEDULED)
export class ScheduledProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledProcessor.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super()
  }

  async process(job: Job): Promise<void> {
    switch (job.name as ScheduledJobName) {
      case ScheduledJobName.STREAK_RISK_CHECK:
        await this.streakRiskCheck()
        break
      default:
        this.logger.warn(`Unknown scheduled job: ${job.name}`)
    }
  }

  private async streakRiskCheck(): Promise<void> {
    const yesterday = subDays(startOfDay(new Date()), 1)
    const today = startOfDay(new Date())

    const atRisk = await this.usersService.findUsersAtRisk(yesterday, today)

    for (const stats of atRisk) {
      const alreadySent = await this.notificationsService.hasNotificationToday(
        stats.userId,
        'STREAK_RISK',
      )
      if (!alreadySent) {
        await this.notificationQueue.add(NotificationJobName.STREAK_RISK, {
          userId: stats.userId,
          streak: stats.currentStreak,
        })
      }
    }

    this.logger.log(`Streak risk check: ${atRisk.length} users at risk`)
  }
}
