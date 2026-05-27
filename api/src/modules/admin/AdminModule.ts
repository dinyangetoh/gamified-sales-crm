import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/ConfigModule'
import { LeaderboardModule } from '../leaderboard/LeaderboardModule'
import { UsersModule } from '../users/UsersModule'
import { NotificationsModule } from '../notifications/NotificationsModule'
import { AdminOverviewService } from './AdminOverviewService'
import { AdminOverviewController } from './controllers/AdminOverviewController'
import { AdminNotificationsController } from './controllers/AdminNotificationsController'
import { AdminEmailsController } from './controllers/AdminEmailsController'
import { AdminRulesController } from './controllers/AdminRulesController'
import { AdminRepsController } from './controllers/AdminRepsController'

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
