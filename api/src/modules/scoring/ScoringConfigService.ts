import { Inject, Injectable, Logger } from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { CACHE_TTL_SCORING_CONFIG } from './constants'
import { IScoringConfigRepository } from './repositories/IScoringConfigRepository'
import { SCORING_CONFIG_REPOSITORY } from './scoringConfig.tokens'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class ScoringConfigService {
  private readonly logger = new Logger(ScoringConfigService.name)

  constructor(
    @Inject(SCORING_CONFIG_REPOSITORY) private readonly repository: IScoringConfigRepository,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
  ) {}

  async getConfig(): Promise<ScoringConfig> {
    try {
      const cached = await this.cache.get<ScoringConfig>(CacheKey.scoringConfig())
      if (cached) return cached

      const config = await this.repository.getConfig()
      await this.cache.set(CacheKey.scoringConfig(), config, CACHE_TTL_SCORING_CONFIG)
      return config
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: ScoringConfigService.name,
        method: 'getConfig',
        operation: 'loadScoringConfig',
        safeMessage: 'Unable to load scoring configuration right now.',
      })
    }
  }

  async invalidate(): Promise<void> {
    try {
      await this.cache.del(CacheKey.scoringConfig())
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: ScoringConfigService.name,
        method: 'invalidate',
        operation: 'invalidateScoringConfigCache',
        safeMessage: 'Unable to invalidate scoring configuration cache right now.',
      })
    }
  }
}
