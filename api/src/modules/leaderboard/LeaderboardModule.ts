import { Module } from '@nestjs/common'
import { LeaderboardService } from './LeaderboardService'
import { LeaderboardController } from './LeaderboardController'

@Module({
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
