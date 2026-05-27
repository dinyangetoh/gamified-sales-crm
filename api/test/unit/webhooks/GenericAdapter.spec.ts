import * as crypto from 'crypto'
import { mock, mockDeep, MockProxy, DeepMockProxy } from 'jest-mock-extended'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { EventType } from '@prisma/client'
import { GenericAdapter } from '../../../src/modules/webhooks/adapters/GenericAdapter'
import { PrismaService } from '../../../src/common/prisma/PrismaService'
import { WEBHOOK_TIMESTAMP_TOLERANCE_MS } from '../../../src/modules/scoring/constants'

const SECRET = 'test-webhook-secret-32-chars-xxxx'

function makeSignedRequest(body: unknown, secretOverride = SECRET, timestampOverride?: number) {
  const timestamp = String(timestampOverride ?? Date.now())
  const rawBody = Buffer.from(JSON.stringify(body))
  const sig = crypto
    .createHmac('sha256', secretOverride)
    .update(`${timestamp}.${rawBody.toString()}`)
    .digest('hex')

  return {
    headers: { 'x-webhook-timestamp': timestamp, 'x-webhook-signature': sig },
    body,
    rawBody,
    method: 'POST',
    protocol: 'http',
    hostname: 'localhost',
    originalUrl: '/webhooks/generic',
  } as unknown as import('../../../src/modules/webhooks/adapters/CrmAdapter.interface').RawRequest
}

describe('GenericAdapter', () => {
  let adapter: GenericAdapter
  let prisma: DeepMockProxy<PrismaService>
  let config: MockProxy<ConfigService>

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>()
    config = mock<ConfigService>()
    config.get.mockReturnValue(SECRET)

    const module = await Test.createTestingModule({
      providers: [
        GenericAdapter,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile()

    adapter = module.get(GenericAdapter)
  })

  describe('verifySignature', () => {
    it('returns true for a valid signature', async () => {
      const req = makeSignedRequest({ eventId: 'e1', userId: 'u1', eventType: 'DEAL_WON' })
      expect(await adapter.verifySignature(req)).toBe(true)
    })

    it('returns false when signature is wrong', async () => {
      const req = makeSignedRequest({ eventId: 'e1' }, 'wrong-secret-32-chars-xxxxxxxxxx')
      expect(await adapter.verifySignature(req)).toBe(false)
    })

    it('returns false when timestamp is missing', async () => {
      const req = {
        headers: { 'x-webhook-signature': 'abc' },
        body: {},
        rawBody: Buffer.from('{}'),
      } as unknown as import('../../../src/modules/webhooks/adapters/CrmAdapter.interface').RawRequest
      expect(await adapter.verifySignature(req)).toBe(false)
    })

    it('returns false when signature is missing', async () => {
      const req = {
        headers: { 'x-webhook-timestamp': String(Date.now()) },
        body: {},
        rawBody: Buffer.from('{}'),
      } as unknown as import('../../../src/modules/webhooks/adapters/CrmAdapter.interface').RawRequest
      expect(await adapter.verifySignature(req)).toBe(false)
    })

    it('returns false when timestamp is outside tolerance window', async () => {
      const expiredTs = Date.now() - WEBHOOK_TIMESTAMP_TOLERANCE_MS - 1000
      const req = makeSignedRequest({ eventId: 'e1' }, SECRET, expiredTs)
      expect(await adapter.verifySignature(req)).toBe(false)
    })
  })

  describe('extractRawEvents', () => {
    it('wraps a single object in an array', () => {
      const result = adapter.extractRawEvents({ eventId: 'e1' })
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ eventId: 'e1' })
    })

    it('returns an array unchanged', () => {
      const events = [{ eventId: 'e1' }, { eventId: 'e2' }]
      const result = adapter.extractRawEvents(events)
      expect(result).toHaveLength(2)
    })
  })

  describe('normalizeEvent', () => {
    it('maps known event type strings correctly', () => {
      const raw = {
        eventId: 'evt-1',
        eventType: 'DEAL_WON',
        entityId: 'deal-1',
        timestamp: new Date().toISOString(),
      }
      const result = adapter.normalizeEvent(raw, 'user-1')
      expect(result.eventType).toBe(EventType.DEAL_WON)
      expect(result.userId).toBe('user-1')
      expect(result.provider).toBe('generic')
    })

    it('maps snake_case event type strings correctly', () => {
      const raw = { eventId: 'e2', eventType: 'deal_won', entityId: 'x', timestamp: new Date().toISOString() }
      const result = adapter.normalizeEvent(raw, 'user-1')
      expect(result.eventType).toBe(EventType.DEAL_WON)
    })

    it('defaults to LEAD_CONTACTED for unknown event types', () => {
      const raw = { eventId: 'e3', eventType: 'unknown_type', entityId: 'x', timestamp: new Date().toISOString() }
      const result = adapter.normalizeEvent(raw, 'user-1')
      expect(result.eventType).toBe(EventType.LEAD_CONTACTED)
    })
  })

  describe('resolveUserId', () => {
    it('returns user id when user exists', async () => {
      const user = { id: 'user-abc', email: 'x@x.com', name: 'X', role: 'SALES_REP', passwordHash: 'x', createdAt: new Date(), updatedAt: new Date() }
      prisma.user.findUnique.mockResolvedValue(user as never)
      const result = await adapter.resolveUserId({ userId: 'user-abc' })
      expect(result).toBe('user-abc')
    })

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(adapter.resolveUserId({ userId: 'missing' })).rejects.toThrow()
    })

    it('throws NotFoundException when userId is missing from payload', async () => {
      await expect(adapter.resolveUserId({})).rejects.toThrow()
    })
  })
})
