import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import type { Queue } from 'bullmq'
import { QueueName } from '../../common/queues/QueueName'
import { currentIsoWeek } from '../scoring/isoWeekUtils'
import { LeaderboardService } from '../leaderboard/LeaderboardService'
import { UsersService } from '../users/UsersService'
import { ManagerOverviewResponseDto, ManagerOverviewAtRiskItemDto, ManagerOverviewRepDto } from './dto/ManagerOverviewResponseDto'

@Injectable()
export class ManagerOverviewService {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly usersService: UsersService,
    @InjectQueue(QueueName.INGESTION) private readonly ingestionQueue: Queue,
    @InjectQueue(QueueName.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  async getOverview(isoWeek?: string): Promise<ManagerOverviewResponseDto> {
    const week = isoWeek ?? currentIsoWeek()

    const leaderboard = (await this.leaderboardService.getWeeklyLeaderboard(week)) as { entries: any[] }
    const top3Entries = leaderboard.entries.slice(0, 3)

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const atRiskStats = await this.usersService.findUsersAtRisk(yesterday, today)
    const atRisk: ManagerOverviewAtRiskItemDto[] = atRiskStats.map((s: any) => ({
      userId: s.userId,
      name: s.user?.name ?? '—',
      reason: 'Streak at risk',
    }))

    const [ingestionFailed, notificationFailed] = await Promise.all([
      this.ingestionQueue.getFailed(0, 50),
      this.notificationQueue.getFailed(0, 50),
    ])

    const top3: ManagerOverviewRepDto[] = top3Entries.map((e: any) => ({
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
      dlq: {
        ingestionFailedCount: ingestionFailed.length,
        notificationFailedCount: notificationFailed.length,
      },
    }
  }
}

