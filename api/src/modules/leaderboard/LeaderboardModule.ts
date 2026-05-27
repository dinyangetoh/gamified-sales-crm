import { Module } from '@nestjs/common'
import { ScoringModule } from '../scoring/ScoringModule'
import { UsersModule } from '../users/UsersModule'
import { LeaderboardRepository } from './LeaderboardRepository'
import { LeaderboardService } from './LeaderboardService'
import { LeaderboardController } from './LeaderboardController'

@Module({
  imports: [ScoringModule, UsersModule],
  providers: [LeaderboardRepository, LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
