import { mock, MockProxy } from 'jest-mock-extended'
import { DeduplicationService } from '../../../src/common/cache/DeduplicationService'
import { ICacheAdapter } from '../../../src/common/cache/ICacheAdapter'
import { CacheKey } from '../../../src/common/cache/CacheKey'
import { DEDUP_TTL_SECONDS } from '../../../src/modules/scoring/constants'

describe('DeduplicationService', () => {
  let service: DeduplicationService
  let cache: MockProxy<ICacheAdapter>

  beforeEach(() => {
    cache = mock<ICacheAdapter>()
    service = new DeduplicationService(cache)
  })

  describe('isProcessed', () => {
    it('returns false (not duplicate) when key is new', async () => {
      cache.setNX.mockResolvedValue(true)
      const result = await service.isProcessed('evt-001')
      expect(result).toBe(false)
    })

    it('returns true (duplicate) when key already exists', async () => {
      cache.setNX.mockResolvedValue(false)
      const result = await service.isProcessed('evt-001')
      expect(result).toBe(true)
    })

    it('calls setNX with correct key and TTL for default provider', async () => {
      cache.setNX.mockResolvedValue(true)
      await service.isProcessed('evt-abc')
      expect(cache.setNX).toHaveBeenCalledWith(
        CacheKey.dedup('generic', 'evt-abc'),
        DEDUP_TTL_SECONDS,
      )
    })

    it('calls setNX with correct key for custom provider', async () => {
      cache.setNX.mockResolvedValue(true)
      await service.isProcessed('evt-xyz', 'hubspot')
      expect(cache.setNX).toHaveBeenCalledWith(
        CacheKey.dedup('hubspot', 'evt-xyz'),
        DEDUP_TTL_SECONDS,
      )
    })

    it('second call returns true regardless of prior state', async () => {
      cache.setNX.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
      await service.isProcessed('evt-dup')
      const secondCall = await service.isProcessed('evt-dup')
      expect(secondCall).toBe(true)
    })
  })
})
