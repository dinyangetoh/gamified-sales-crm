import { mock, mockDeep, MockProxy, DeepMockProxy } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'
import { LeaderboardService } from '../../../src/modules/leaderboard/LeaderboardService'
import { PrismaService } from '../../../src/common/prisma/PrismaService'
import { ICacheAdapter, CACHE_ADAPTER } from '../../../src/common/cache/ICacheAdapter'

type WeeklyResult = { week: string; entries: { weekPoints: number; rank: number; pointsGap: number; userId: string }[]; fromCache: boolean }
type AllTimeResult = { entries: { totalXP: number; rank: number; pointsGap: number }[]; fromCache: boolean }

const LEVELS = [
  { level: 1, minXP: 0, label: 'Rookie', updatedAt: new Date() },
  { level: 2, minXP: 100, label: 'Closer', updatedAt: new Date() },
  { level: 3, minXP: 250, label: 'Elite', updatedAt: new Date() },
  { level: 4, minXP: 500, label: 'Legend', updatedAt: new Date() },
]

function makeWeeklyStat(userId: string, weekPoints: number, totalXP = 0) {
  return {
    id: `ws-${userId}`,
    userId,
    isoWeek: '2025-W21',
    weekPoints,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: userId,
      name: `User ${userId}`,
      email: `${userId}@test.com`,
      role: 'SALES_REP',
      passwordHash: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: { totalXP, level: 1, currentStreak: 0, longestStreak: 0 },
      badgeAwards: [],
    },
  }
}

describe('LeaderboardService', () => {
  let service: LeaderboardService
  let prisma: DeepMockProxy<PrismaService>
  let cache: MockProxy<ICacheAdapter>

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>()
    cache = mock<ICacheAdapter>()
    cache.get.mockResolvedValue(null)
    cache.set.mockResolvedValue(undefined)

    prisma.levelConfig.findMany.mockResolvedValue(LEVELS)

    const module = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: CACHE_ADAPTER, useValue: cache },
      ],
    }).compile()

    service = module.get(LeaderboardService)
  })

  describe('getWeeklyLeaderboard', () => {
    it('returns entries sorted by weekPoints descending', async () => {
      prisma.weeklyStat.findMany.mockResolvedValue([
        makeWeeklyStat('alice', 300),
        makeWeeklyStat('bob', 200),
        makeWeeklyStat('charlie', 100),
      ] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries.map((e) => e.weekPoints)).toEqual([300, 200, 100])
    })

    it('assigns rank 1 to the top entry', async () => {
      prisma.weeklyStat.findMany.mockResolvedValue([makeWeeklyStat('alice', 300)] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries[0].rank).toBe(1)
    })

    it('rank 1 always has pointsGap of 0', async () => {
      prisma.weeklyStat.findMany.mockResolvedValue([
        makeWeeklyStat('alice', 300),
        makeWeeklyStat('bob', 200),
      ] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries[0].pointsGap).toBe(0)
    })

    it('computes correct pointsGap for lower ranks', async () => {
      prisma.weeklyStat.findMany.mockResolvedValue([
        makeWeeklyStat('alice', 300),
        makeWeeklyStat('bob', 200),
        makeWeeklyStat('charlie', 150),
      ] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries[1].pointsGap).toBe(100)
      expect(result.entries[2].pointsGap).toBe(50)
    })

    it('returns fromCache:true on cache hit', async () => {
      cache.get.mockResolvedValue({ week: '2025-W21', generatedAt: new Date(), entries: [], fromCache: false })
      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.fromCache).toBe(true)
    })

    it('does not query DB on cache hit', async () => {
      cache.get.mockResolvedValue({ week: '2025-W21', generatedAt: new Date(), entries: [], fromCache: false })
      await service.getWeeklyLeaderboard('2025-W21')
      expect(prisma.weeklyStat.findMany).not.toHaveBeenCalled()
    })

    it('writes to cache after DB query', async () => {
      prisma.weeklyStat.findMany.mockResolvedValue([makeWeeklyStat('alice', 300)] as never)

      await service.getWeeklyLeaderboard('2025-W21')
      expect(cache.set).toHaveBeenCalled()
    })
  })

  describe('getAllTimeLeaderboard', () => {
    function makeUserStat(userId: string, totalXP: number) {
      return {
        id: `s-${userId}`,
        userId,
        totalXP,
        totalPoints: totalXP,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: userId,
          name: `User ${userId}`,
          email: `${userId}@test.com`,
          role: 'SALES_REP',
          passwordHash: 'x',
          createdAt: new Date(),
          updatedAt: new Date(),
          badgeAwards: [],
        },
      }
    }

    it('sorts by totalXP descending', async () => {
      prisma.userStats.findMany.mockResolvedValue([
        makeUserStat('alice', 500),
        makeUserStat('bob', 300),
        makeUserStat('charlie', 100),
      ] as never)

      const result = await service.getAllTimeLeaderboard() as AllTimeResult
      expect(result.entries.map((e) => e.totalXP)).toEqual([500, 300, 100])
    })

    it('rank 1 has pointsGap 0, rank 2 shows correct gap', async () => {
      prisma.userStats.findMany.mockResolvedValue([
        makeUserStat('alice', 500),
        makeUserStat('bob', 300),
      ] as never)

      const result = await service.getAllTimeLeaderboard() as AllTimeResult
      expect(result.entries[0].pointsGap).toBe(0)
      expect(result.entries[1].pointsGap).toBe(200)
    })
  })
})
