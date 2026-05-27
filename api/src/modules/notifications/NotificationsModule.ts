import { Module } from '@nestjs/common'
import { NotificationsRepository } from './NotificationsRepository'
import { NotificationsService } from './NotificationsService'

@Module({
  providers: [NotificationsRepository, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
