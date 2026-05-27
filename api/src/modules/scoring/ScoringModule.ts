import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
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
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
