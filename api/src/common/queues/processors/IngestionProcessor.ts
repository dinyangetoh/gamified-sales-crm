import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { ScoringService } from '../../../modules/scoring/ScoringService'
import { GenericAdapter } from '../../../modules/webhooks/adapters/GenericAdapter'
import { HubspotAdapter } from '../../../modules/webhooks/adapters/HubspotAdapter'
import { QueueName } from '../QueueName'
import { IngestionJobName } from '../JobName'
import type { CrmAdapter } from '../../../modules/webhooks/adapters/CrmAdapter.interface'

interface RawEventJob {
  provider: string
  raw: unknown
}

@Processor(QueueName.INGESTION)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name)
  private readonly adapters: Map<string, CrmAdapter>

  constructor(
    private readonly scoringService: ScoringService,
    private readonly genericAdapter: GenericAdapter,
    private readonly hubspotAdapter: HubspotAdapter,
  ) {
    super()
    this.adapters = new Map<string, CrmAdapter>([
      ['generic', genericAdapter],
      ['hubspot', hubspotAdapter],
    ])
  }

  async process(job: Job<RawEventJob>): Promise<void> {
    if (job.name !== IngestionJobName.RAW_EVENT) return

    const { provider, raw } = job.data
    const adapter = this.adapters.get(provider)
    if (!adapter) {
      this.logger.warn(`No adapter for provider: ${provider}`)
      return
    }

    const userId = await adapter.resolveUserId(raw)
    const canonical = adapter.normalizeEvent(raw, userId)
    await this.scoringService.processEvent(canonical)
  }
}
