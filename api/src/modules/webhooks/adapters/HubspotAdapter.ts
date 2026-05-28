import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import { EventType } from '@db'
import { CrmAdapter, CanonicalEvent, RawRequest } from './CrmAdapter.interface'
import { WEBHOOK_TIMESTAMP_TOLERANCE_MS } from '../../scoring/constants'

const HS_EVENT_TYPE_MAP: Record<string, EventType> = {
  'contact.creation': EventType.LEAD_CONTACTED,
  'deal.creation': EventType.STAGE_ADVANCED,
  'deal.propertyChange': EventType.STAGE_ADVANCED,
  'deal.deletion': EventType.DEAL_LOST,
}

@Injectable()
export class HubspotAdapter implements CrmAdapter {
  private readonly logger = new Logger(HubspotAdapter.name)
  private readonly secret: string

  constructor(private readonly configService: ConfigService) {
    this.secret = configService.get<string>('WEBHOOK_SECRET_HUBSPOT') ?? ''
  }

  async verifySignature(req: RawRequest): Promise<boolean> {
    const timestamp = req.headers['x-hubspot-request-timestamp'] as string
    const signature = req.headers['x-hubspot-signature-v3'] as string

    if (!timestamp || !signature) return false

    const ts = parseInt(timestamp, 10)
    if (Math.abs(Date.now() - ts) > WEBHOOK_TIMESTAMP_TOLERANCE_MS) return false

    const method = req.method.toUpperCase()
    const uri = `${req.protocol}://${req.hostname}${req.originalUrl}`
    const rawBody = req.rawBody?.toString() ?? JSON.stringify(req.body)
    const message = `${method}${uri}${rawBody}${timestamp}`

    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(message)
      .digest('base64')

    const expectedBuf = Buffer.from(expected, 'utf8')
    const signatureBuf = Buffer.from(signature, 'utf8')
    if (expectedBuf.length !== signatureBuf.length) return false

    return crypto.timingSafeEqual(expectedBuf, signatureBuf)
  }

  extractRawEvents(body: unknown): unknown[] {
    return Array.isArray(body) ? body : [body]
  }

  normalizeEvent(raw: unknown, resolvedUserId: string): CanonicalEvent {
    const r = raw as Record<string, unknown>
    const subscriptionType = r.subscriptionType as string
    return {
      eventId: String(r.eventId ?? r.objectId ?? Date.now()),
      userId: resolvedUserId,
      provider: 'hubspot',
      eventType: HS_EVENT_TYPE_MAP[subscriptionType] ?? EventType.STAGE_ADVANCED,
      entityId: String(r.objectId ?? 'unknown'),
      timestamp: new Date((r.occurredAt as number) ?? Date.now()),
      metadata: { subscriptionType, portalId: r.portalId },
    }
  }

  async resolveUserId(_raw: unknown): Promise<string> {
    this.logger.warn(
      'HubSpot resolveUserId requires live API credentials — stubbed in POC. ' +
        'Production: GET /crm/v3/objects/deals/{objectId}?properties=hubspot_owner_id ' +
        'then lookup CrmUserMap WHERE provider=hubspot AND externalId=ownerId',
    )
    throw new Error('HubSpot resolveUserId not implemented — requires live credentials')
  }
}
