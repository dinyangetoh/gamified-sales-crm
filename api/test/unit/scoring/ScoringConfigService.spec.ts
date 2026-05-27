import { mock, MockProxy } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'
import { ScoringConfigService } from '../../../src/modules/scoring/ScoringConfigService'
import { IScoringConfigRepository } from '../../../src/modules/scoring/repositories/IScoringConfigRepository'
import { SCORING_CONFIG_REPOSITORY } from '../../../src/modules/scoring/scoringConfig.tokens'
import { ICacheAdapter, CACHE_ADAPTER } from '../../../src/common/cache/ICacheAdapter'
import { CacheKey } from '../../../src/common/cache/CacheKey'

const CONFIG = {
  pointRules: { LEAD_CONTACTED: 10 },
  dailyCaps: { LEAD_CONTACTED: { maxCount: 5, isActive: true } },
  levels: [{ level: 1, minXP: 0, label: 'Rookie' }],
} as const

describe('ScoringConfigService', () => {
  let service: ScoringConfigService
  let repository: MockProxy<IScoringConfigRepository>
  let cache: MockProxy<ICacheAdapter>

  beforeEach(async () => {
    repository = mock<IScoringConfigRepository>()
    cache = mock<ICacheAdapter>()
    repository.getConfig.mockResolvedValue(CONFIG as never)
    cache.get.mockResolvedValue(null)
    cache.set.mockResolvedValue(undefined)
    cache.del.mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ScoringConfigService,
        { provide: SCORING_CONFIG_REPOSITORY, useValue: repository },
        { provide: CACHE_ADAPTER, useValue: cache },
      ],
    }).compile()

    service = module.get(ScoringConfigService)
  })

  it('returns cached config without calling repository', async () => {
    cache.get.mockResolvedValue(CONFIG as never)
    const result = await service.getConfig()
    expect(result).toEqual(CONFIG)
    expect(repository.getConfig).not.toHaveBeenCalled()
  })

  it('loads from repository and caches on miss', async () => {
    const result = await service.getConfig()
    expect(result).toEqual(CONFIG)
    expect(repository.getConfig).toHaveBeenCalledTimes(1)
    expect(cache.set).toHaveBeenCalledWith(CacheKey.scoringConfig(), CONFIG, expect.any(Number))
  })

  it('invalidates cache key', async () => {
    await service.invalidate()
    expect(cache.del).toHaveBeenCalledWith(CacheKey.scoringConfig())
  })
})
