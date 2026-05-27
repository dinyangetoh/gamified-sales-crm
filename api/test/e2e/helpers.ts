import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../../src/AppModule'
import { PrismaService } from '../../src/common/prisma/PrismaService'

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()

  app.use(
    '/webhooks',
    (req: { rawBody?: Buffer }, _res: unknown, buf: Buffer) => {
      if (buf?.length) req.rawBody = buf
    },
  )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  await app.init()
  return app
}

export async function getAuthToken(
  app: INestApplication,
  email: string,
  password = 'Demo1234!',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200)
  return res.body.accessToken as string
}

export function getPrisma(app: INestApplication): PrismaService {
  return app.get(PrismaService)
}
