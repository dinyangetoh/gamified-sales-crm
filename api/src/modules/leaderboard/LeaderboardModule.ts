import { Module } from '@nestjs/common'
import { ScoringModule } from '../scoring/ScoringModule'
import { UsersModule } from '../users/UsersModule'
import { LeaderboardRepository } from './LeaderboardRepository'
import { LeaderboardService } from './LeaderboardService'
import { LeaderboardController } from './LeaderboardController'
import { ManagerService } from './ManagerService'
import { ManagerController } from './ManagerController'

@Module({
  imports: [ScoringModule, UsersModule],
  providers: [LeaderboardRepository, LeaderboardService, ManagerService],
  controllers: [LeaderboardController, ManagerController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
