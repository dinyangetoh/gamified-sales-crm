import { Injectable } from '@nestjs/common'
import { currentIsoWeek } from '../scoring/isoWeekUtils'
import { LeaderboardService } from '../leaderboard/LeaderboardService'
import { UsersService } from '../users/UsersService'
import {
  AdminOverviewResponseDto,
  AdminOverviewAtRiskItemDto,
  AdminOverviewRepDto,
} from './dto/AdminOverviewResponseDto'

@Injectable()
export class AdminOverviewService {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly usersService: UsersService,
  ) {}

  async getOverview(isoWeek?: string): Promise<AdminOverviewResponseDto> {
    const week = isoWeek ?? currentIsoWeek()

    const leaderboard = (await this.leaderboardService.getWeeklyLeaderboard(week)) as { entries: any[] }
    const top3Entries = leaderboard.entries.slice(0, 3)

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const atRiskStats = await this.usersService.findUsersAtRisk(yesterday, today)
    const atRisk: AdminOverviewAtRiskItemDto[] = atRiskStats.map((s: any) => ({
      userId: s.userId,
      name: s.user?.name ?? '—',
      reason: 'Streak at risk',
    }))

    const top3: AdminOverviewRepDto[] = top3Entries.map((e: any) => ({
      userId: e.userId,
      name: e.name,
      rank: e.rank,
      weekPoints: e.weekPoints ?? 0,
      levelLabel: e.levelLabel,
      currentStreak: e.currentStreak,
      badges: e.badges,
    }))

    return {
      top3,
      atRisk,
      kpis: {},
    }
  }
}
