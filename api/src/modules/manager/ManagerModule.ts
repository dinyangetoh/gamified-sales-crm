import { Module } from '@nestjs/common'
import { QueuesModule } from '../../common/queues/QueuesModule'
import { LeaderboardModule } from '../leaderboard/LeaderboardModule'
import { UsersModule } from '../users/UsersModule'
import { NotificationsModule } from '../notifications/NotificationsModule'
import { ManagerOverviewService } from './ManagerOverviewService'
import { ManagerOverviewController } from './ManagerOverviewController'
import { ManagerNotificationsController } from './ManagerNotificationsController'
import { ManagerEmailsController } from './ManagerEmailsController'

@Module({
  imports: [QueuesModule, LeaderboardModule, UsersModule, NotificationsModule],
  providers: [ManagerOverviewService],
  controllers: [ManagerOverviewController, ManagerNotificationsController, ManagerEmailsController],
})
export class ManagerModule {}

