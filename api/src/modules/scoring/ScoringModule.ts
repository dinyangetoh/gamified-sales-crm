import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ScoringRepository } from './ScoringRepository'
import { ScoringService } from './ScoringService'
import { BadgesModule } from '../badges/BadgesModule'
import { UsersModule } from '../users/UsersModule'
import { QueueName } from '../../common/queues/QueueName'

@Module({
  imports: [
    BadgesModule,
    UsersModule,
    BullModule.registerQueue({ name: QueueName.NOTIFICATION }),
  ],
  providers: [ScoringRepository, ScoringService],
  exports: [ScoringRepository, ScoringService],
})
export class ScoringModule {}
