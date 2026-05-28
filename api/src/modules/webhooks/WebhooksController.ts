import { Controller, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common'
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import type { Request } from 'express'
import { Public } from '../../common/decorators/public'
import { WebhookGuard } from '../../common/guards/WebhookGuard'
import { QueueName } from '../../common/queues/QueueName'
import { IngestionJobName } from '../../common/queues/JobName'
import type { CrmAdapter } from './adapters/CrmAdapter.interface'
import { WebhookAcceptedDto } from './dto/WebhookAcceptedDto'
import { ErrorResponseDto } from '../../common/dto/ErrorResponseDto'

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    @InjectQueue(QueueName.INGESTION) private readonly ingestionQueue: Queue,
  ) {}

  @Public()
  @UseGuards(WebhookGuard)
  @Post(':provider')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Receive CRM webhook events' })
  @ApiResponse({ status: 202, type: WebhookAcceptedDto })
  @ApiUnauthorizedResponse({ description: 'Invalid HMAC signature', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Unknown provider', type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async receive(
    @Param('provider') provider: string,
    @Req() req: Request & { crmAdapter?: CrmAdapter },
  ) {
    const adapter = req.crmAdapter
    if (!adapter) return { queued: 0 }

    const rawEvents = adapter.extractRawEvents(req.body)

    for (const raw of rawEvents) {
      await this.ingestionQueue.add(IngestionJobName.RAW_EVENT, { provider, raw })
    }

    return { queued: rawEvents.length }
  }
}
