import { BadgeType, EventType } from '@prisma/client'
import { BadgesService } from '../../../src/modules/badges/BadgesService'

function makeTx(overrides: {
  existingAwards?: BadgeType[]
  progressCount?: number
  progressId?: string
  existingProgress?: { id: string; currentCount: number; isCompleted: boolean } | null
} = {}) {
  const { existingAwards = [], progressCount = 1, progressId = 'prog-1', existingProgress = null } = overrides

  const awardFindMany = jest.fn().mockResolvedValue(
    existingAwards.map((badgeType) => ({ badgeType })),
  )
  const progressUpsert = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const progressFindFirst = jest.fn().mockResolvedValue(existingProgress)
  const progressUpdate = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const progressCreate = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const awardCreate = jest.fn().mockResolvedValue({})

  return {
    badgeAward: { findMany: awardFindMany, create: awardCreate },
    badgeProgress: { upsert: progressUpsert, findFirst: progressFindFirst, update: progressUpdate, create: progressCreate },
    _mocks: { awardFindMany, progressUpsert, progressFindFirst, progressUpdate, progressCreate, awardCreate },
  }
}

describe('BadgesService', () => {
  let service: BadgesService

  beforeEach(() => {
    service = new BadgesService()
  })

  describe('FIRST_WIN badge (lifetime / null weekKey)', () => {
    it('unlocks on first DEAL_WON (no existing progress)', async () => {
      const tx = makeTx({ progressCount: 1, existingProgress: null })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W01', 1)
      expect(result.unlocked).toContain(BadgeType.FIRST_WIN)
    })

    it('unlocks on first DEAL_WON (with existing progress at count 1)', async () => {
      const existing = { id: 'p1', currentCount: 0, isCompleted: false }
      const tx = makeTx({ progressCount: 1, existingProgress: existing })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W01', 1)
      expect(result.unlocked).toContain(BadgeType.FIRST_WIN)
    })

    it('does not unlock again if already earned', async () => {
      const tx = makeTx({ existingAwards: [BadgeType.FIRST_WIN] })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W01', 1)
      expect(result.unlocked).not.toContain(BadgeType.FIRST_WIN)
    })

    it('does not unlock on LEAD_CONTACTED', async () => {
      const tx = makeTx()
      const result = await service.evaluate(tx as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 1)
      expect(result.unlocked).not.toContain(BadgeType.FIRST_WIN)
    })
  })

  describe('CONSISTENT_CLOSER badge (iso_week)', () => {
    it('does not unlock at 2nd DEAL_WON in week', async () => {
      const tx = makeTx({ progressCount: 2 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W02', 1)
      expect(result.unlocked).not.toContain(BadgeType.CONSISTENT_CLOSER)
    })

    it('unlocks at 3rd DEAL_WON in same week', async () => {
      const tx = makeTx({ progressCount: 3 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W02', 1)
      expect(result.unlocked).toContain(BadgeType.CONSISTENT_CLOSER)
    })

    it('scopes to isoWeek — progress in a different week does not carry over', async () => {
      const tx = makeTx({ progressCount: 1 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W03', 1)
      expect(result.unlocked).not.toContain(BadgeType.CONSISTENT_CLOSER)
    })
  })

  describe('PIPELINE_BUILDER badge (iso_week)', () => {
    it('does not unlock at 4 STAGE_ADVANCED events', async () => {
      const tx = makeTx({ progressCount: 4 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.STAGE_ADVANCED, '2024-W01', 0)
      expect(result.unlocked).not.toContain(BadgeType.PIPELINE_BUILDER)
    })

    it('unlocks at 5th STAGE_ADVANCED in same week', async () => {
      const tx = makeTx({ progressCount: 5 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.STAGE_ADVANCED, '2024-W01', 0)
      expect(result.unlocked).toContain(BadgeType.PIPELINE_BUILDER)
    })
  })

  describe('HOT_STREAK badge (streak-based)', () => {
    it('does not unlock when streak is 4', async () => {
      const tx = makeTx()
      const result = await service.evaluate(tx as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 4)
      expect(result.unlocked).not.toContain(BadgeType.HOT_STREAK)
    })

    it('unlocks when streak reaches 5', async () => {
      const tx = makeTx()
      const result = await service.evaluate(tx as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 5)
      expect(result.unlocked).toContain(BadgeType.HOT_STREAK)
    })

    it('unlocks on any event type when streak >= 5', async () => {
      const tx = makeTx()
      const result = await service.evaluate(tx as never, 'user-1', EventType.MEETING_COMPLETED, '2024-W01', 7)
      expect(result.unlocked).toContain(BadgeType.HOT_STREAK)
    })

    it('does not unlock again if already earned', async () => {
      const tx = makeTx({ existingAwards: [BadgeType.HOT_STREAK] })
      const result = await service.evaluate(tx as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 10)
      expect(result.unlocked).not.toContain(BadgeType.HOT_STREAK)
    })
  })

  describe('return value', () => {
    it('returns empty unlocked array when no badges qualify', async () => {
      const tx = makeTx({ progressCount: 1 })
      const result = await service.evaluate(tx as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 0)
      expect(result.unlocked).toHaveLength(0)
    })

    it('can unlock multiple badges in one call (FIRST_WIN + HOT_STREAK)', async () => {
      const tx = makeTx({ progressCount: 1, existingProgress: null })
      const result = await service.evaluate(tx as never, 'user-1', EventType.DEAL_WON, '2024-W01', 5)
      expect(result.unlocked).toContain(BadgeType.FIRST_WIN)
      expect(result.unlocked).toContain(BadgeType.HOT_STREAK)
    })
  })
})
