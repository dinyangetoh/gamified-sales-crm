import { Inject, Injectable } from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { CACHE_TTL_LEADERBOARD } from '../scoring/constants'
import { currentIsoWeek, previousIsoWeek } from '../../common/helpers/scoring/isoWeekHelper'
import { deriveLevelLabel } from '../../common/helpers/scoring/levelHelper'
import { dedupeBadgeAwards } from '../../common/helpers/badges/badgeDisplayHelper'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { LeaderboardRepository } from './LeaderboardRepository'
import { ScoringConfigService } from '../scoring/ScoringConfigService'

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardRepo: LeaderboardRepository,
    private readonly scoringConfigService: ScoringConfigService,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
  ) {}

  async getWeeklyLeaderboard(isoWeek?: string) {
    const week = isoWeek ?? currentIsoWeek()
    const prevWeek = previousIsoWeek(week)
    const cacheKey = CacheKey.leaderboard(week)

    const cached = await this.cache.get(cacheKey)
    if (cached) return { ...(cached as object), fromCache: true }

    const [weekStats, prevWeekStats, { levels }] = await Promise.all([
      this.leaderboardRepo.findWeeklyStats(week),
      this.leaderboardRepo.findWeeklyStats(prevWeek),
      this.scoringConfigService.getConfig(),
    ])

    const prevRankByUserId = new Map(prevWeekStats.map((ws, idx) => [ws.userId, idx + 1]))

    const entries = weekStats.map((ws, idx) =>
      this.buildWeeklyEntry(ws, idx, weekStats, prevRankByUserId, levels),
    )

    const result = { week, generatedAt: new Date(), fromCache: false, entries }
    await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
    return result
  }

  async getAllTimeLeaderboard() {
    const cacheKey = CacheKey.leaderboardAllTime()
    const cached = await this.cache.get(cacheKey)
    if (cached) return { ...(cached as object), fromCache: true }

    const [allStats, { levels }] = await Promise.all([
      this.leaderboardRepo.findAllUserStats(),
      this.scoringConfigService.getConfig(),
    ])

    const entries = allStats.map((s, idx) => this.buildAllTimeEntry(s, idx, allStats, levels))

    const result = { generatedAt: new Date(), fromCache: false, entries }
    await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
    return result
  }

  private buildWeeklyEntry(
    ws: Awaited<ReturnType<LeaderboardRepository['findWeeklyStats']>>[number],
    idx: number,
    weekStats: Awaited<ReturnType<LeaderboardRepository['findWeeklyStats']>>,
    prevRankByUserId: Map<string, number>,
    levels: ScoringConfig['levels'],
  ) {
    const rank = idx + 1
    const lastWeekRank = prevRankByUserId.get(ws.userId)
    const rankDelta = lastWeekRank !== undefined ? lastWeekRank - rank : undefined
    const above = weekStats[idx - 1]
    const pointsGap = above ? above.weekPoints - ws.weekPoints : 0
    const totalXP = ws.user.stats?.totalXP ?? 0
    const level = ws.user.stats?.level ?? 1
    const levelLabel = deriveLevelLabel(totalXP, levels)
    const badges = dedupeBadgeAwards(ws.user.badgeAwards)

    return {
      rank,
      userId: ws.userId,
      name: ws.user.name,
      weekPoints: ws.weekPoints,
      totalXP,
      level,
      levelLabel,
      currentStreak: ws.user.stats?.currentStreak ?? 0,
      pointsGap,
      lastWeekRank,
      rankDelta,
      badges,
    }
  }

  private buildAllTimeEntry(
    s: Awaited<ReturnType<LeaderboardRepository['findAllUserStats']>>[number],
    idx: number,
    allStats: Awaited<ReturnType<LeaderboardRepository['findAllUserStats']>>,
    levels: ScoringConfig['levels'],
  ) {
    const above = allStats[idx - 1]
    const pointsGap = above ? above.totalXP - s.totalXP : 0
    const levelLabel = deriveLevelLabel(s.totalXP, levels)
    const badges = dedupeBadgeAwards(s.user.badgeAwards)

    return {
      rank: idx + 1,
      userId: s.userId,
      name: s.user.name,
      totalXP: s.totalXP,
      totalPoints: s.totalPoints,
      level: s.level,
      levelLabel,
      currentStreak: s.currentStreak,
      pointsGap,
      badges,
    }
  }
}
