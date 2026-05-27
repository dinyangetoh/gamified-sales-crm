import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp } from './helpers'

describe('GET /health', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns 200 with status ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200)
    expect(res.body.status).toBe('ok')
  })

  it('does not require authentication', async () => {
    await request(app.getHttpServer()).get('/health').expect(200)
  })
})
