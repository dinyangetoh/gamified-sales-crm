import { mock, MockProxy } from 'jest-mock-extended'
import { BadgeType, EventType } from '@prisma/client'
import { BadgesService } from '../../../src/modules/badges/BadgesService'
import { BadgesRepository } from '../../../src/modules/badges/BadgesRepository'

function makeTx(overrides: {
  existingAwards?: BadgeType[]
  progressCount?: number
  progressId?: string
  existingProgress?: { id: string; currentCount: number; isCompleted: boolean } | null
  awardsByWeek?: Record<string, BadgeType[]>
  hotStreakInStreak?: boolean
} = {}) {
  const {
    existingAwards = [],
    progressCount = 1,
    progressId = 'prog-1',
    existingProgress = null,
    awardsByWeek = {},
    hotStreakInStreak = false,
  } = overrides

  const awardFindMany = jest.fn().mockResolvedValue(
    existingAwards.map((badgeType) => ({ badgeType })),
  )
  const progressUpsert = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const progressFindFirst = jest.fn().mockResolvedValue(existingProgress)
  const progressUpdate = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const progressCreate = jest.fn().mockResolvedValue({ id: progressId, currentCount: progressCount, isCompleted: false })
  const awardCreate = jest.fn().mockResolvedValue({})

  const awardFindFirst = jest.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) => {
    if (where.badgeType === BadgeType.HOT_STREAK && where.awardedAt) {
      return Promise.resolve(hotStreakInStreak ? { id: 'hs-1' } : null)
    }
    const weekKey = where.weekKey as string | undefined
    if (weekKey && awardsByWeek[weekKey]?.includes(where.badgeType as BadgeType)) {
      return Promise.resolve({ id: 'w-1' })
    }
    if (!weekKey && existingAwards.includes(where.badgeType as BadgeType)) {
      return Promise.resolve({ id: 'a-1' })
    }
    return Promise.resolve(null)
  })

  return {
    badgeAward: { findMany: awardFindMany, findFirst: awardFindFirst, create: awardCreate },
    badgeProgress: { upsert: progressUpsert, findFirst: progressFindFirst, update: progressUpdate, create: progressCreate },
    _mocks: { awardFindMany, progressUpsert, progressFindFirst, progressUpdate, progressCreate, awardCreate, awardFindFirst },
  }
}

describe('BadgesService', () => {
  let service: BadgesService
  let badgesRepo: MockProxy<BadgesRepository>

  beforeEach(() => {
    badgesRepo = mock<BadgesRepository>()
    service = new BadgesService(badgesRepo)

    const asTxClient = (txClient: unknown) => txClient as ReturnType<typeof makeTx>
    badgesRepo.findBadgeProgress.mockImplementation((txClient, userId, badgeType, weekKey) =>
      asTxClient(txClient).badgeProgress.findFirst({ where: { userId, badgeType, weekKey } }),
    )
    badgesRepo.updateBadgeProgress.mockImplementation((txClient, id, data) =>
      asTxClient(txClient).badgeProgress.update({ where: { id }, data }),
    )
    badgesRepo.createBadgeProgress.mockImplementation((txClient, data) =>
      asTxClient(txClient).badgeProgress.create({ data }),
    )
    badgesRepo.upsertBadgeProgress.mockImplementation((txClient, userId, badgeType, weekKey, targetCount) =>
      asTxClient(txClient).badgeProgress.upsert({
        where: { userId_badgeType_weekKey: { userId, badgeType, weekKey } },
        create: { userId, badgeType, currentCount: 1, targetCount, weekKey },
        update: { currentCount: { increment: 1 } },
      }),
    )
    badgesRepo.createBadgeAward.mockImplementation((txClient, userId, badgeType, weekKey, awardedAt) =>
      asTxClient(txClient).badgeAward.create({ data: { userId, badgeType, weekKey, awardedAt } }),
    )
    badgesRepo.hasBadgeAward.mockImplementation((txClient, userId, badgeType) =>
      asTxClient(txClient)
        .badgeAward.findFirst({ where: { userId, badgeType } })
        .then((row: { id: string } | null) => row !== null),
    )
    badgesRepo.hasBadgeAwardForWeek.mockImplementation((txClient, userId, badgeType, weekKey) =>
      asTxClient(txClient)
        .badgeAward.findFirst({ where: { userId, badgeType, weekKey } })
        .then((row: { id: string } | null) => row !== null),
    )
    badgesRepo.hasHotStreakAwardInCurrentStreak.mockImplementation((txClient, userId, _streak, asOf) =>
      asTxClient(txClient)
        .badgeAward.findFirst({
          where: { userId, badgeType: BadgeType.HOT_STREAK, awardedAt: { gte: asOf } },
        })
        .then((row: { id: string } | null) => row !== null),
    )
  })

  describe('FIRST_WIN badge (once)', () => {
    it('unlocks on first DEAL_WON', async () => {
      const txClient = makeTx({ progressCount: 1, existingProgress: null })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.DEAL_WON, '2024-W01', 1)
      expect(result.unlocked).toContain(BadgeType.FIRST_WIN)
    })

    it('does not unlock again if already earned', async () => {
      const txClient = makeTx({ existingAwards: [BadgeType.FIRST_WIN] })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.DEAL_WON, '2024-W01', 1)
      expect(result.unlocked).not.toContain(BadgeType.FIRST_WIN)
    })
  })

  describe('CONSISTENT_CLOSER badge (per_iso_week)', () => {
    it('unlocks at 3rd DEAL_WON in same week', async () => {
      const txClient = makeTx({ progressCount: 3 })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.DEAL_WON, '2024-W02', 1)
      expect(result.unlocked).toContain(BadgeType.CONSISTENT_CLOSER)
    })

    it('can unlock again in a new week after prior week award', async () => {
      const txClient = makeTx({ progressCount: 3, awardsByWeek: { '2024-W01': [BadgeType.CONSISTENT_CLOSER] } })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.DEAL_WON, '2024-W02', 1)
      expect(result.unlocked).toContain(BadgeType.CONSISTENT_CLOSER)
    })

    it('does not unlock twice in the same week', async () => {
      const txClient = makeTx({ progressCount: 4, awardsByWeek: { '2024-W02': [BadgeType.CONSISTENT_CLOSER] } })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.DEAL_WON, '2024-W02', 1)
      expect(result.unlocked).not.toContain(BadgeType.CONSISTENT_CLOSER)
    })
  })

  describe('HOT_STREAK badge (repeatable_lifetime)', () => {
    it('unlocks when streak reaches 5', async () => {
      const txClient = makeTx()
      const result = await service.evaluate(txClient as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 5)
      expect(result.unlocked).toContain(BadgeType.HOT_STREAK)
    })

    it('does not unlock again during the same streak run', async () => {
      const txClient = makeTx({ hotStreakInStreak: true })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 10)
      expect(result.unlocked).not.toContain(BadgeType.HOT_STREAK)
    })

    it('can unlock again after a new streak run', async () => {
      const txClient = makeTx({ hotStreakInStreak: false })
      const result = await service.evaluate(txClient as never, 'user-1', EventType.LEAD_CONTACTED, '2024-W01', 5)
      expect(result.unlocked).toContain(BadgeType.HOT_STREAK)
    })
  })
})
