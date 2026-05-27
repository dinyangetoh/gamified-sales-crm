import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bullmq'
import { envSchema } from './common/config/env.schema'
import { PrismaModule } from './common/prisma/PrismaModule'
import { CacheModule } from './common/cache/CacheModule'
import { AuthModule } from './modules/auth/AuthModule'
import { UsersModule } from './modules/users/UsersModule'
import { EventsModule } from './modules/events/EventsModule'
import { WebhooksModule } from './modules/webhooks/WebhooksModule'
import { ScoringModule } from './modules/scoring/ScoringModule'
import { BadgesModule } from './modules/badges/BadgesModule'
import { LeaderboardModule } from './modules/leaderboard/LeaderboardModule'
import { NotificationsModule } from './modules/notifications/NotificationsModule'
import { QueuesModule } from './common/queues/QueuesModule'
import { HealthModule } from './common/health/HealthModule'
import { ManagerController } from './modules/leaderboard/ManagerController'
import { AdminController } from './common/queues/AdminController'
import { JwtAuthGuard } from './common/guards/JwtAuthGuard'
import { RolesGuard } from './common/guards/RolesGuard'
import { GlobalExceptionFilter } from './common/filters/GlobalExceptionFilter'
import { LoggingInterceptor } from './common/interceptors/LoggingInterceptor'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const parsed = envSchema.safeParse(config)
        if (!parsed.success) {
          throw new Error(`Config validation error: ${parsed.error.toString()}`)
        }
        return parsed.data
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    EventsModule,
    WebhooksModule,
    ScoringModule,
    BadgesModule,
    LeaderboardModule,
    NotificationsModule,
    QueuesModule,
    HealthModule,
  ],
  controllers: [ManagerController, AdminController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
