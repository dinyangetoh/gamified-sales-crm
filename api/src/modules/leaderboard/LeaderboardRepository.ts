import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/PrismaService'

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWeeklyStats(isoWeek: string) {
    return this.prisma.weeklyStat.findMany({
      where: { isoWeek },
      orderBy: [
        { weekPoints: 'desc' },
        { user: { stats: { totalXP: 'desc' } } },
        { user: { stats: { currentStreak: 'desc' } } },
      ],
      include: { user: { include: { stats: true, badgeAwards: true } } },
    })
  }

  findAllUserStats() {
    return this.prisma.userStats.findMany({
      orderBy: [{ totalXP: 'desc' }, { currentStreak: 'desc' }],
      include: { user: { include: { badgeAwards: true } } },
    })
  }
}
