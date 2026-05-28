import { LeaderboardRepository } from '../../../src/modules/leaderboard/LeaderboardRepository'

jest.mock('../../../src/common/prisma/PrismaService', () => ({
  PrismaService: class PrismaService {},
}))

describe('LeaderboardRepository', () => {
  it('applies weekly ordering by weekPoints, totalXP, then currentStreak', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const prisma = {
      weeklyStat: { findMany },
      userStats: { findMany: jest.fn() },
    } as unknown as ConstructorParameters<typeof LeaderboardRepository>[0]

    const repo = new LeaderboardRepository(prisma)
    await repo.findWeeklyStats('2026-W22')

    expect(findMany).toHaveBeenCalledWith({
      where: { isoWeek: '2026-W22' },
      orderBy: [
        { weekPoints: 'desc' },
        { user: { stats: { totalXP: 'desc' } } },
        { user: { stats: { currentStreak: 'desc' } } },
      ],
      include: { user: { include: { stats: true, badgeAwards: true } } },
    })
  })

  it('applies all-time ordering by totalXP then currentStreak', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const prisma = {
      weeklyStat: { findMany: jest.fn() },
      userStats: { findMany },
    } as unknown as ConstructorParameters<typeof LeaderboardRepository>[0]

    const repo = new LeaderboardRepository(prisma)
    await repo.findAllUserStats()

    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ totalXP: 'desc' }, { currentStreak: 'desc' }],
      include: { user: { include: { badgeAwards: true } } },
    })
  })
})
