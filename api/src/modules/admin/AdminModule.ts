import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/ConfigModule'
import { LeaderboardModule } from '../leaderboard/LeaderboardModule'
import { UsersModule } from '../users/UsersModule'
import { NotificationsModule } from '../notifications/NotificationsModule'
import { AdminOverviewService } from './AdminOverviewService'
import { AdminOverviewController } from './AdminOverviewController'
import { AdminNotificationsController } from './AdminNotificationsController'
import { AdminEmailsController } from './AdminEmailsController'
import { AdminRulesController } from './AdminRulesController'
import { AdminRepsController } from './AdminRepsController'

@Module({
  imports: [ConfigModule, LeaderboardModule, UsersModule, NotificationsModule],
  providers: [AdminOverviewService],
  controllers: [
    AdminOverviewController,
    AdminNotificationsController,
    AdminEmailsController,
    AdminRulesController,
    AdminRepsController,
  ],
})
export class AdminModule {}
