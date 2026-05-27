import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ScoringRepository } from './ScoringRepository'
import { ScoringService } from './ScoringService'
import { ScoringConfigService } from './ScoringConfigService'
import { JsonScoringConfigRepository } from './JsonScoringConfigRepository'
import { DbScoringConfigRepository } from './DbScoringConfigRepository'
import { SCORING_CONFIG_REPOSITORY } from './scoringConfig.tokens'
import { BadgesModule } from '../badges/BadgesModule'
import { UsersModule } from '../users/UsersModule'
import { QueueName } from '../../common/queues/QueueName'

@Module({
  imports: [
    BadgesModule,
    UsersModule,
    BullModule.registerQueue({ name: QueueName.NOTIFICATION }),
  ],
  providers: [
    ScoringRepository,
    DbScoringConfigRepository,
    { provide: SCORING_CONFIG_REPOSITORY, useClass: JsonScoringConfigRepository },
    ScoringConfigService,
    ScoringService,
  ],
  exports: [ScoringRepository, ScoringService, ScoringConfigService],
})
export class ScoringModule {}
