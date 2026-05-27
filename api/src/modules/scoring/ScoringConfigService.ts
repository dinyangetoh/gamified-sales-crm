import { Inject, Injectable } from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { CACHE_TTL_SCORING_CONFIG } from './constants'
import { IScoringConfigRepository } from './repositories/IScoringConfigRepository'
import { SCORING_CONFIG_REPOSITORY } from './scoringConfig.tokens'

@Injectable()
export class ScoringConfigService {
  constructor(
    @Inject(SCORING_CONFIG_REPOSITORY) private readonly repository: IScoringConfigRepository,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
  ) {}

  async getConfig(): Promise<ScoringConfig> {
    const cached = await this.cache.get<ScoringConfig>(CacheKey.scoringConfig())
    if (cached) return cached

    const config = await this.repository.getConfig()
    await this.cache.set(CacheKey.scoringConfig(), config, CACHE_TTL_SCORING_CONFIG)
    return config
  }

  async invalidate(): Promise<void> {
    await this.cache.del(CacheKey.scoringConfig())
  }
}
