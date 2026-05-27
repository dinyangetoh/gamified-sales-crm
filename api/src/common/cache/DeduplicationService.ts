import { Inject, Injectable } from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from './ICacheAdapter'
import { CacheKey } from './CacheKey'
import { DEDUP_TTL_SECONDS } from '../../modules/scoring/constants'

@Injectable()
export class DeduplicationService {
  constructor(@Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter) {}

  async isProcessed(eventId: string, provider = 'generic'): Promise<boolean> {
    const key = CacheKey.dedup(provider, eventId)
    const isNew = await this.cache.setNX(key, DEDUP_TTL_SECONDS)
    return !isNew
  }
}
