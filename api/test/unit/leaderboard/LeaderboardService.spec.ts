import { mock, MockProxy } from 'jest-mock-extended'
import { Test } from '@nestjs/testing'
import { LeaderboardService } from '../../../src/modules/leaderboard/LeaderboardService'
import { LeaderboardRepository } from '../../../src/modules/leaderboard/LeaderboardRepository'
import { ScoringConfigService } from '../../../src/modules/scoring/ScoringConfigService'
import { ICacheAdapter, CACHE_ADAPTER } from '../../../src/common/cache/ICacheAdapter'

type WeeklyResult = { week: string; entries: { weekPoints: number; rank: number; pointsGap: number; userId: string }[]; fromCache: boolean }
type AllTimeResult = { entries: { totalXP: number; rank: number; pointsGap: number }[]; fromCache: boolean }

const LEVELS = [
  { level: 1, minXP: 0, label: 'Rookie' },
  { level: 2, minXP: 100, label: 'Closer' },
  { level: 3, minXP: 250, label: 'Elite' },
  { level: 4, minXP: 500, label: 'Legend' },
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
  let leaderboardRepo: MockProxy<LeaderboardRepository>
  let scoringConfigService: MockProxy<ScoringConfigService>
  let cache: MockProxy<ICacheAdapter>

  beforeEach(async () => {
    leaderboardRepo = mock<LeaderboardRepository>()
    scoringConfigService = mock<ScoringConfigService>()
    cache = mock<ICacheAdapter>()
    cache.get.mockResolvedValue(null)
    cache.set.mockResolvedValue(undefined)
    scoringConfigService.getConfig.mockResolvedValue({
      pointRules: {},
      dailyCaps: {},
      levels: LEVELS,
    } as never)

    const module = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: LeaderboardRepository, useValue: leaderboardRepo },
        { provide: ScoringConfigService, useValue: scoringConfigService },
        { provide: CACHE_ADAPTER, useValue: cache },
      ],
    }).compile()

    service = module.get(LeaderboardService)
  })

  describe('getWeeklyLeaderboard', () => {
    it('returns entries sorted by weekPoints descending', async () => {
      leaderboardRepo.findWeeklyStats.mockResolvedValue([
        makeWeeklyStat('alice', 300),
        makeWeeklyStat('bob', 200),
        makeWeeklyStat('charlie', 100),
      ] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries.map((e) => e.weekPoints)).toEqual([300, 200, 100])
    })

    it('assigns rank 1 to the top entry', async () => {
      leaderboardRepo.findWeeklyStats.mockResolvedValue([makeWeeklyStat('alice', 300)] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries[0].rank).toBe(1)
    })

    it('rank 1 always has pointsGap of 0', async () => {
      leaderboardRepo.findWeeklyStats.mockResolvedValue([
        makeWeeklyStat('alice', 300),
        makeWeeklyStat('bob', 200),
      ] as never)

      const result = await service.getWeeklyLeaderboard('2025-W21') as WeeklyResult
      expect(result.entries[0].pointsGap).toBe(0)
    })

    it('computes correct pointsGap for lower ranks', async () => {
      leaderboardRepo.findWeeklyStats.mockResolvedValue([
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
      expect(leaderboardRepo.findWeeklyStats).not.toHaveBeenCalled()
    })

    it('writes to cache after DB query', async () => {
      leaderboardRepo.findWeeklyStats.mockResolvedValue([makeWeeklyStat('alice', 300)] as never)

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
      leaderboardRepo.findAllUserStats.mockResolvedValue([
        makeUserStat('alice', 500),
        makeUserStat('bob', 300),
        makeUserStat('charlie', 100),
      ] as never)

      const result = await service.getAllTimeLeaderboard() as AllTimeResult
      expect(result.entries.map((e) => e.totalXP)).toEqual([500, 300, 100])
    })

    it('rank 1 has pointsGap 0, rank 2 shows correct gap', async () => {
      leaderboardRepo.findAllUserStats.mockResolvedValue([
        makeUserStat('alice', 500),
        makeUserStat('bob', 300),
      ] as never)

      const result = await service.getAllTimeLeaderboard() as AllTimeResult
      expect(result.entries[0].pointsGap).toBe(0)
      expect(result.entries[1].pointsGap).toBe(200)
    })
  })
})
