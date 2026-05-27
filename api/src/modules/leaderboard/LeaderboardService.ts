import { Inject, Injectable } from '@nestjs/common'
import { CACHE_ADAPTER, ICacheAdapter } from '../../common/cache/ICacheAdapter'
import { CacheKey } from '../../common/cache/CacheKey'
import { CACHE_TTL_LEADERBOARD } from '../scoring/constants'
import { currentIsoWeek, previousIsoWeek } from '../scoring/isoWeekUtils'
import { deriveLevelLabel } from '../scoring/levelUtils'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { LeaderboardRepository } from './LeaderboardRepository'
import { ScoringRepository } from '../scoring/ScoringRepository'

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly leaderboardRepo: LeaderboardRepository,
    private readonly scoringRepo: ScoringRepository,
    @Inject(CACHE_ADAPTER) private readonly cache: ICacheAdapter,
  ) {}

  async getWeeklyLeaderboard(isoWeek?: string) {
    const week = isoWeek ?? currentIsoWeek()
    const prevWeek = previousIsoWeek(week)
    const cacheKey = CacheKey.leaderboard(week)

    const cached = await this.cache.get(cacheKey)
    if (cached) return { ...(cached as object), fromCache: true }

    const [weekStats, prevWeekStats, levels] = await Promise.all([
      this.leaderboardRepo.findWeeklyStats(week),
      this.leaderboardRepo.findWeeklyStats(prevWeek),
      this.scoringRepo.findLevelConfigs(),
    ])

    const prevRankByUserId = new Map(prevWeekStats.map((ws, idx) => [ws.userId, idx + 1]))

    const entries = weekStats.map((ws, idx) => {
      const rank = idx + 1
      const lastWeekRank = prevRankByUserId.get(ws.userId)
      const rankDelta = lastWeekRank !== undefined ? lastWeekRank - rank : undefined
      const above = weekStats[idx - 1]
      const pointsGap = above ? above.weekPoints - ws.weekPoints : 0
      const totalXP = ws.user.stats?.totalXP ?? 0
      const level = ws.user.stats?.level ?? 1
      const levelLabel = deriveLevelLabel(totalXP, levels)

      const badges = ws.user.badgeAwards.map((b) => {
        const def = BADGE_DEFINITIONS.find((d) => d.type === b.badgeType)!
        return { type: b.badgeType, displayName: def.displayName, iconUrl: def.iconUrl }
      })

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
    })

    const result = { week, generatedAt: new Date(), fromCache: false, entries }
    await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
    return result
  }

  async getAllTimeLeaderboard() {
    const cacheKey = CacheKey.leaderboardAllTime()
    const cached = await this.cache.get(cacheKey)
    if (cached) return { ...(cached as object), fromCache: true }

    const [allStats, levels] = await Promise.all([
      this.leaderboardRepo.findAllUserStats(),
      this.scoringRepo.findLevelConfigs(),
    ])

    const entries = allStats.map((s, idx) => {
      const above = allStats[idx - 1]
      const pointsGap = above ? above.totalXP - s.totalXP : 0
      const levelLabel = deriveLevelLabel(s.totalXP, levels)

      const badges = s.user.badgeAwards.map((b) => {
        const def = BADGE_DEFINITIONS.find((d) => d.type === b.badgeType)!
        return { type: b.badgeType, displayName: def.displayName, iconUrl: def.iconUrl }
      })

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
    })

    const result = { generatedAt: new Date(), fromCache: false, entries }
    await this.cache.set(cacheKey, result, CACHE_TTL_LEADERBOARD)
    return result
  }
}
