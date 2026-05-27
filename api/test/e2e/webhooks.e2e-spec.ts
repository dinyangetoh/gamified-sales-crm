import * as crypto from 'crypto'
import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from './helpers'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_GENERIC ?? 'demo-secret-change-in-production'

function signPayload(body: unknown): { timestamp: string; signature: string; rawBody: Buffer } {
  const timestamp = String(Date.now())
  const rawBody = Buffer.from(JSON.stringify(body))
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody.toString()}`)
    .digest('hex')
  return { timestamp, signature, rawBody }
}

describe('Webhooks (POST /webhooks/:provider)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  const validPayload = {
    eventId: `wh-e2e-${Date.now()}`,
    userId: 'ignored-resolved-later',
    eventType: 'DEAL_WON',
    entityId: 'deal-wh-1',
    timestamp: new Date().toISOString(),
  }

  describe('valid signature', () => {
    it('returns 202 with queued count', async () => {
      const { timestamp, signature } = signPayload(validPayload)
      const res = await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', timestamp)
        .set('x-webhook-signature', signature)
        .send(validPayload)

      expect(res.status).toBe(202)
      expect(res.body.queued).toBe(1)
    })

    it('accepts an array payload and reports correct queued count', async () => {
      const events = [
        { ...validPayload, eventId: `wh-arr-1-${Date.now()}` },
        { ...validPayload, eventId: `wh-arr-2-${Date.now()}` },
      ]
      const { timestamp, signature } = signPayload(events)

      const res = await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', timestamp)
        .set('x-webhook-signature', signature)
        .send(events)

      expect(res.status).toBe(202)
      expect(res.body.queued).toBe(2)
    })
  })

  describe('invalid signature', () => {
    it('returns 401 when signature is wrong', async () => {
      const { timestamp } = signPayload(validPayload)

      await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', timestamp)
        .set('x-webhook-signature', 'deadbeef')
        .send(validPayload)
        .expect(401)
    })

    it('returns 401 when timestamp header is missing', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-signature', 'deadbeef')
        .send(validPayload)
        .expect(401)
    })

    it('returns 401 when signature header is missing', async () => {
      await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', String(Date.now()))
        .send(validPayload)
        .expect(401)
    })

    it('returns 401 when timestamp is expired', async () => {
      const expiredTs = String(Date.now() - 10 * 60 * 1000)
      const signature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(`${expiredTs}.${JSON.stringify(validPayload)}`)
        .digest('hex')

      await request(app.getHttpServer())
        .post('/webhooks/generic')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', expiredTs)
        .set('x-webhook-signature', signature)
        .send(validPayload)
        .expect(401)
    })
  })

  describe('unknown provider', () => {
    it('returns 401 for an unknown provider (no adapter registered)', async () => {
      const { timestamp, signature } = signPayload(validPayload)

      await request(app.getHttpServer())
        .post('/webhooks/unknown-crm')
        .set('Content-Type', 'application/json')
        .set('x-webhook-timestamp', timestamp)
        .set('x-webhook-signature', signature)
        .send(validPayload)
        .expect(401)
    })
  })
})
