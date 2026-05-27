import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp, getAuthToken } from './helpers'

describe('Leaderboard', () => {
  let app: INestApplication
  let token: string

  beforeAll(async () => {
    app = await createTestApp()
    token = await getAuthToken(app, 'alice@demo.com')
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /leaderboard', () => {
    it('returns 200 with entries array', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(Array.isArray(res.body.entries)).toBe(true)
    })

    it('entries are sorted by weekPoints descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const points: number[] = res.body.entries.map((e: { weekPoints: number }) => e.weekPoints)
      const sorted = [...points].sort((a, b) => b - a)
      expect(points).toEqual(sorted)
    })

    it('rank 1 entry has pointsGap of 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      if (res.body.entries.length > 0) {
        expect(res.body.entries[0].rank).toBe(1)
        expect(res.body.entries[0].pointsGap).toBe(0)
      }
    })

    it('accepts a ?week= query param in ISO week format', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard?week=2025-W01')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toHaveProperty('entries')
    })

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer()).get('/leaderboard').expect(401)
    })
  })

  describe('GET /leaderboard/all-time', () => {
    it('returns 200 with entries sorted by totalXP descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard/all-time')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(Array.isArray(res.body.entries)).toBe(true)

      const xps: number[] = res.body.entries.map((e: { totalXP: number }) => e.totalXP)
      const sorted = [...xps].sort((a, b) => b - a)
      expect(xps).toEqual(sorted)
    })

    it('rank 1 entry has pointsGap of 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/leaderboard/all-time')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      if (res.body.entries.length > 0) {
        expect(res.body.entries[0].rank).toBe(1)
        expect(res.body.entries[0].pointsGap).toBe(0)
      }
    })

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer()).get('/leaderboard/all-time').expect(401)
    })
  })
})
