import { Module } from '@nestjs/common'
import { ScoringModule } from '../scoring/ScoringModule'
import { ConfigController } from './ConfigController'
import { ConfigService } from './ConfigService'

@Module({
  imports: [ScoringModule],
  providers: [ConfigService],
  controllers: [ConfigController],
  exports: [ConfigService],
})
export class ConfigModule {}

