import * as request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { createTestApp, getAuthToken, getPrisma } from './helpers'

describe('Users', () => {
  let app: INestApplication
  let aliceToken: string
  let bobToken: string
  let managerToken: string
  let aliceId: string
  let bobId: string

  beforeAll(async () => {
    app = await createTestApp()
    const prisma = getPrisma(app)

    const alice = await prisma.user.findUnique({ where: { email: 'alice@demo.com' } })
    const bob = await prisma.user.findUnique({ where: { email: 'bob@demo.com' } })
    aliceId = alice!.id
    bobId = bob!.id

    aliceToken = await getAuthToken(app, 'alice@demo.com')
    bobToken = await getAuthToken(app, 'bob@demo.com')
    managerToken = await getAuthToken(app, 'manager@demo.com')
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /users/:userId', () => {
    it('SALES_REP can view their own profile', async () => {
      await request(app.getHttpServer())
        .get(`/users/${aliceId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200)
    })

    it('SALES_REP gets 403 when viewing another user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${bobId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(403)
    })

    it('MANAGER can view any user profile', async () => {
      await request(app.getHttpServer())
        .get(`/users/${aliceId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
    })

    it('MANAGER can view a different user profile', async () => {
      await request(app.getHttpServer())
        .get(`/users/${bobId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
    })

    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/users/${aliceId}`)
        .expect(401)
    })

    it('returns 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404)
    })
  })
})
