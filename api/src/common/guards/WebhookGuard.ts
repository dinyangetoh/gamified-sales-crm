import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { GenericAdapter } from '../../modules/webhooks/adapters/GenericAdapter'
import { HubspotAdapter } from '../../modules/webhooks/adapters/HubspotAdapter'
import type { CrmAdapter, RawRequest } from '../../modules/webhooks/adapters/CrmAdapter.interface'

@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name)
  private readonly adapters: Map<string, CrmAdapter>

  constructor(
    private readonly genericAdapter: GenericAdapter,
    private readonly hubspotAdapter: HubspotAdapter,
  ) {
    this.adapters = new Map<string, CrmAdapter>([
      ['generic', genericAdapter],
      ['hubspot', hubspotAdapter],
    ])
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { crmAdapter?: CrmAdapter }>()
    const provider = req.params['provider'] as string

    const adapter = this.adapters.get(provider)
    if (!adapter) throw new NotFoundException(`Unknown webhook provider: ${provider}`)

    const valid = await adapter.verifySignature(req as RawRequest)
    if (!valid) {
      this.logger.warn({ provider, ip: req.ip }, 'Webhook signature verification failed')
      throw new UnauthorizedException()
    }

    req.crmAdapter = adapter
    return true
  }
}
