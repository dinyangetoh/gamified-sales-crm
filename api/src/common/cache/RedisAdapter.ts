import { Injectable } from '@nestjs/common'
import { Redis } from 'ioredis'
import { ICacheAdapter } from './ICacheAdapter'

@Injectable()
export class RedisAdapter implements ICacheAdapter {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key)
    return val ? (JSON.parse(val) as T) : null
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async setNX(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }
}
