import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { UsersModule } from '../users/UsersModule'
import { WebhooksController } from './WebhooksController'
import { GenericAdapter } from './adapters/GenericAdapter'
import { HubspotAdapter } from './adapters/HubspotAdapter'
import { WebhookGuard } from '../../common/guards/WebhookGuard'
import { QueueName } from '../../common/queues/QueueName'

@Module({
  imports: [UsersModule, BullModule.registerQueue({ name: QueueName.INGESTION })],
  providers: [GenericAdapter, HubspotAdapter, WebhookGuard],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
