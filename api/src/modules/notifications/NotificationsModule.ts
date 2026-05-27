import { Module } from '@nestjs/common'
import { NotificationsService } from './NotificationsService'

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
