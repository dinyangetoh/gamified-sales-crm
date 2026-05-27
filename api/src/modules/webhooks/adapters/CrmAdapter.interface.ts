import type { Request } from 'express'
import { EventType } from '@db'

export interface RawRequest extends Request {
  rawBody?: Buffer
}

export interface CanonicalEvent {
  eventId: string
  userId: string
  provider: string
  eventType: EventType
  entityId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface CrmAdapter {
  verifySignature(req: RawRequest): Promise<boolean>
  extractRawEvents(body: unknown): unknown[]
  normalizeEvent(raw: unknown, resolvedUserId: string): CanonicalEvent
  resolveUserId(raw: unknown): Promise<string>
}
