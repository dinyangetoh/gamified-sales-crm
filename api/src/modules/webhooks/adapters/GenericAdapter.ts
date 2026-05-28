import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'
import { EventType } from '@db'
import { UsersService } from '../../users/UsersService'
import { CrmAdapter, CanonicalEvent, RawRequest } from './CrmAdapter.interface'
import { WEBHOOK_TIMESTAMP_TOLERANCE_MS } from '../../scoring/constants'

const EVENT_TYPE_MAP: Record<string, EventType> = {
  lead_contacted: EventType.LEAD_CONTACTED,
  meeting_completed: EventType.MEETING_COMPLETED,
  stage_advanced: EventType.STAGE_ADVANCED,
  deal_won: EventType.DEAL_WON,
  deal_lost: EventType.DEAL_LOST,
  LEAD_CONTACTED: EventType.LEAD_CONTACTED,
  MEETING_COMPLETED: EventType.MEETING_COMPLETED,
  STAGE_ADVANCED: EventType.STAGE_ADVANCED,
  DEAL_WON: EventType.DEAL_WON,
  DEAL_LOST: EventType.DEAL_LOST,
}

@Injectable()
export class GenericAdapter implements CrmAdapter {
  private readonly secret: string

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.secret = configService.get<string>('WEBHOOK_SECRET_GENERIC') as string
  }

  async verifySignature(req: RawRequest): Promise<boolean> {
    const timestamp = req.headers['x-webhook-timestamp'] as string
    const signature = req.headers['x-webhook-signature'] as string

    if (!timestamp || !signature) return false

    const ts = parseInt(timestamp, 10)
    if (Math.abs(Date.now() - ts) > WEBHOOK_TIMESTAMP_TOLERANCE_MS) return false

    const rawBody = req.rawBody?.toString() ?? JSON.stringify(req.body)
    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

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
    return {
      eventId: r.eventId as string,
      userId: resolvedUserId,
      provider: 'generic',
      eventType: EVENT_TYPE_MAP[r.eventType as string] ?? EventType.LEAD_CONTACTED,
      entityId: (r.entityId as string) ?? 'unknown',
      timestamp: new Date((r.timestamp as string) ?? Date.now()),
      metadata: (r.metadata as Record<string, unknown>) ?? {},
    }
  }

  async resolveUserId(raw: unknown): Promise<string> {
    const r = raw as Record<string, unknown>
    const userId = r.userId as string
    if (!userId) throw new NotFoundException('userId missing in webhook payload')

    const user = await this.usersService.findOrThrow(userId)
    return user.id
  }
}
