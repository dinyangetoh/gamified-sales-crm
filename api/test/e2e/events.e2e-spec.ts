import * as request from 'supertest'
import * as bcrypt from 'bcrypt'
import { INestApplication } from '@nestjs/common'
import { createTestApp, getAuthToken, getPrisma } from './helpers'

describe('Events (POST /events)', () => {
  let app: INestApplication
  let token: string
  let userId: string

  beforeAll(async () => {
    app = await createTestApp()
    const prisma = getPrisma(app)

    const hash = await bcrypt.hash('Demo1234!', 10)
    const user = await prisma.user.create({
      data: { email: `e2e-events-${Date.now()}@test.com`, passwordHash: hash, name: 'E2E Test User', role: 'SALES_REP' },
    })
    userId = user.id
    token = await getAuthToken(app, user.email)
  })

  afterAll(async () => {
    const prisma = getPrisma(app)
    await prisma.badgeAward.deleteMany({ where: { userId } })
    await prisma.badgeProgress.deleteMany({ where: { userId } })
    await prisma.awardTimeline.deleteMany({ where: { userId } })
    await prisma.weeklyStat.deleteMany({ where: { userId } })
    await prisma.dailyCap.deleteMany({ where: { userId } })
    await prisma.event.deleteMany({ where: { userId } })
    await prisma.userStats.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await app.close()
  })

  function makeEvent(overrides: Partial<{
    eventId: string
    eventType: string
    entityId: string
    timestamp: string
  }> = {}) {
    return {
      eventId: `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId,
      eventType: 'DEAL_WON',
      entityId: 'deal-e2e-1',
      timestamp: new Date().toISOString(),
      ...overrides,
    }
  }

  describe('happy path', () => {
    it('returns 200 with pointsAwarded and accepted:true for a scored event', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(makeEvent())
        .expect(200)

      expect(res.body.accepted).toBe(true)
      expect(res.body.duplicate).toBe(false)
      expect(res.body.capReached).toBe(false)
      expect(res.body.pointsAwarded).toBe(100)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.totalXP).toBeGreaterThan(0)
    })

    it('response includes badgesUnlocked array', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(makeEvent())
        .expect(200)

      expect(Array.isArray(res.body.badgesUnlocked)).toBe(true)
    })
  })

  describe('duplicate detection', () => {
    it('returns duplicate:true and pointsAwarded:0 when the same eventId is submitted twice', async () => {
      const event = makeEvent({ eventId: `e2e-dup-${Date.now()}` })

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(event)
        .expect(200)

      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(event)
        .expect(200)

      expect(res.body.duplicate).toBe(true)
      expect(res.body.pointsAwarded).toBe(0)
      expect(res.body.accepted).toBe(true)
    })
  })

  describe('daily cap', () => {
    it('6th LEAD_CONTACTED in a day returns capReached:true and pointsAwarded:0', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post('/events')
          .set('Authorization', `Bearer ${token}`)
          .send(makeEvent({ eventId: `e2e-cap-${Date.now()}-${i}`, eventType: 'LEAD_CONTACTED', entityId: `lead-${i}` }))
      )
      for (const req of requests) {
        await req.expect(200)
      }

      const sixthRes = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(makeEvent({ eventId: `e2e-cap-sixth-${Date.now()}`, eventType: 'LEAD_CONTACTED', entityId: 'lead-6' }))
        .expect(200)

      expect(sixthRes.body.capReached).toBe(true)
      expect(sixthRes.body.pointsAwarded).toBe(0)
    })
  })

  describe('authorization', () => {
    it('returns 401 without a token', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .send(makeEvent())
        .expect(401)
    })

    it('SALES_REP gets 403 when submitting an event for another user', async () => {
      const prisma = getPrisma(app)
      const otherUser = await prisma.user.findFirst({ where: { email: 'bob@demo.com' } })

      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(makeEvent({ eventId: `e2e-403-${Date.now()}` }))

      const body = makeEvent({ eventId: `e2e-forbidden-${Date.now()}` })
      body.userId = otherUser!.id

      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(body)

      expect(res.status).toBe(403)
    })
  })

  describe('validation', () => {
    it('returns 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId, eventType: 'DEAL_WON' })
        .expect(400)
    })

    it('returns 400 for invalid eventType', async () => {
      await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send(makeEvent({ eventType: 'INVALID_TYPE' }))
        .expect(400)
    })
  })
})
