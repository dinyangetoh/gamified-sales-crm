import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { CACHE_ADAPTER } from './ICacheAdapter'
import { RedisAdapter } from './RedisAdapter'
import { DeduplicationService } from './DeduplicationService'

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        return new Redis(config.get<string>('REDIS_URL') as string)
      },
      inject: [ConfigService],
    },
    {
      provide: CACHE_ADAPTER,
      useFactory: (redis: Redis) => new RedisAdapter(redis),
      inject: ['REDIS_CLIENT'],
    },
    DeduplicationService,
  ],
  exports: [CACHE_ADAPTER, DeduplicationService, 'REDIS_CLIENT'],
})
export class CacheModule {}
