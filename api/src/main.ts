import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './AppModule'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.use(helmet())
  app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' })

  app.use('/webhooks', (req: { rawBody?: Buffer }, _res: unknown, buf: Buffer, encoding: string) => {
    if (buf?.length) req.rawBody = buf
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Gamification API')
      .setDescription('Sales CRM gamification engine')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`Gamification API listening on port ${port}`)
}

bootstrap()
