import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { CACHE_TTL_LEADERBOARD } from '../scoring/constants'
import { currentIsoWeek, previousIsoWeek } from '../../common/helpers/scoring/isoWeekHelper'
import { deriveLevelLabel } from '../../common/helpers/scoring/levelHelper'
import { dedupeBadgeAwards } from '../../common/helpers/badges/badgeDisplayHelper'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { LeaderboardRepository } from './LeaderboardRepository'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'
import type {
  AllTimeLeaderboardEntry,
  AllTimeLeaderboardResult,
  WeeklyLeaderboardEntry,
  WeeklyLeaderboardResult,
} from './ILeaderboardService'

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name)

  constructor(
    private readonly leaderboardRepo: LeaderboardRepository,
    private readonly scoringConfigService: ScoringConfigService,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
  ) {}

  async getWeeklyLeaderboard(isoWeek?: string): Promise<WeeklyLeaderboardResult> {
    try {
      const week = isoWeek ?? currentIsoWeek()
      const previousWeek = previousIsoWeek(week)
      const cacheKey = CacheKey.leaderboard(week)

      const cached = (await this.cache.get(cacheKey)) as WeeklyLeaderboardResult | null
      if (cached) return { ...cached, fromCache: true }

      const [weeklyStats, previousWeekStats, { levels }] = await Promise.all([
        this.leaderboardRepo.findWeeklyStats(week),
        this.leaderboardRepo.findWeeklyStats(previousWeek),
        this.scoringConfigService.getConfig(),
      ])

      const previousRankByUserId = new Map(
        previousWeekStats.map((weeklyStatRecord, index) => [weeklyStatRecord.userId, index + 1]),
      )

      const entries = weeklyStats.map((weeklyStatRecord, index) =>
        this.buildWeeklyEntry(weeklyStatRecord, index, weeklyStats, previousRankByUserId, levels),
      )

      const result = { week, generatedAt: new Date(), fromCache: false, entries }
      await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
      return result
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: LeaderboardService.name,
        method: 'getWeeklyLeaderboard',
        operation: 'fetchLeaderboardData',
        safeMessage: 'Failed to load weekly leaderboard data.',
        metadata: { isoWeek },
      })
    }
  }

  async getAllTimeLeaderboard(): Promise<AllTimeLeaderboardResult> {
    try {
      const cacheKey = CacheKey.leaderboardAllTime()
      const cached = (await this.cache.get(cacheKey)) as AllTimeLeaderboardResult | null
      if (cached) return { ...cached, fromCache: true }

      const [allTimeStats, { levels }] = await Promise.all([
        this.leaderboardRepo.findAllUserStats(),
        this.scoringConfigService.getConfig(),
      ])

      const entries = allTimeStats.map((allTimeStatRecord, index) =>
        this.buildAllTimeEntry(allTimeStatRecord, index, allTimeStats, levels),
      )

      const result = { generatedAt: new Date(), fromCache: false, entries }
      await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
      return result
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: LeaderboardService.name,
        method: 'getAllTimeLeaderboard',
        operation: 'fetchLeaderboardData',
        safeMessage: 'Failed to load all-time leaderboard data.',
      })
    }
  }

  private buildWeeklyEntry(
    weeklyStatRecord: Awaited<ReturnType<LeaderboardRepository['findWeeklyStats']>>[number],
    index: number,
    weeklyStats: Awaited<ReturnType<LeaderboardRepository['findWeeklyStats']>>,
    previousRankByUserId: Map<string, number>,
    levels: ScoringConfig['levels'],
  ): WeeklyLeaderboardEntry {
    const rank = index + 1
    const lastWeekRank = previousRankByUserId.get(weeklyStatRecord.userId)
    const rankDelta = lastWeekRank !== undefined ? lastWeekRank - rank : undefined
    const aboveRankedWeeklyStat = weeklyStats[index - 1]
    const pointsGap = aboveRankedWeeklyStat
      ? aboveRankedWeeklyStat.weekPoints - weeklyStatRecord.weekPoints
      : 0
    const totalXP = weeklyStatRecord.user.stats?.totalXP ?? 0
    const level = weeklyStatRecord.user.stats?.level ?? 1
    const levelLabel = deriveLevelLabel(totalXP, levels)
    const badges = dedupeBadgeAwards(weeklyStatRecord.user.badgeAwards)

    return {
      rank,
      userId: weeklyStatRecord.userId,
      name: weeklyStatRecord.user.name,
      weekPoints: weeklyStatRecord.weekPoints,
      totalXP,
      level,
      levelLabel,
      currentStreak: weeklyStatRecord.user.stats?.currentStreak ?? 0,
      pointsGap,
      lastWeekRank,
      rankDelta,
      badges,
    }
  }

  private buildAllTimeEntry(
    allTimeStatRecord: Awaited<ReturnType<LeaderboardRepository['findAllUserStats']>>[number],
    index: number,
    allStats: Awaited<ReturnType<LeaderboardRepository['findAllUserStats']>>,
    levels: ScoringConfig['levels'],
  ): AllTimeLeaderboardEntry {
    const aboveRankedAllTimeStat = allStats[index - 1]
    const pointsGap = aboveRankedAllTimeStat
      ? aboveRankedAllTimeStat.totalXP - allTimeStatRecord.totalXP
      : 0
    const levelLabel = deriveLevelLabel(allTimeStatRecord.totalXP, levels)
    const badges = dedupeBadgeAwards(allTimeStatRecord.user.badgeAwards)

    return {
      rank: index + 1,
      userId: allTimeStatRecord.userId,
      name: allTimeStatRecord.user.name,
      totalXP: allTimeStatRecord.totalXP,
      totalPoints: allTimeStatRecord.totalPoints,
      level: allTimeStatRecord.level,
      levelLabel,
      currentStreak: allTimeStatRecord.currentStreak,
      pointsGap,
      badges,
    }
  }
}
