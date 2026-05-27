import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QueueName } from './QueueName'
import { IngestionProcessor } from './processors/IngestionProcessor'
import { NotificationProcessor } from './processors/NotificationProcessor'
import { ScheduledProcessor } from './processors/ScheduledProcessor'
import { ScoringModule } from '../../modules/scoring/ScoringModule'
import { UsersModule } from '../../modules/users/UsersModule'
import { NotificationsModule } from '../../modules/notifications/NotificationsModule'
import { GenericAdapter } from '../../modules/webhooks/adapters/GenericAdapter'
import { HubspotAdapter } from '../../modules/webhooks/adapters/HubspotAdapter'

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: QueueName.INGESTION,
        defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 2000 } },
      },
      {
        name: QueueName.NOTIFICATION,
        defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
      },
      { name: QueueName.SCHEDULED },
    ),
    BullModule.registerFlowProducer({}),
    ScoringModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [
    GenericAdapter,
    HubspotAdapter,
    IngestionProcessor,
    NotificationProcessor,
    ScheduledProcessor,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
