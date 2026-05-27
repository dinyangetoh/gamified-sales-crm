import { Injectable, NotFoundException } from '@nestjs/common'
import { User, UserStats, BadgeType } from '@db'
import { getEventTypeDisplayName } from '../../common/labels/eventTypeLabels'
import { BADGE_DEFINITIONS, getBadgeDefinition } from '../badges/badgeDefinitions'
import { currentIsoWeek } from '../../common/helpers/scoring/isoWeekHelper'
import { UsersRepository } from './UsersRepository'

type BadgeAwardRow = { badgeType: BadgeType; awardedAt: Date; weekKey?: string | null }
type BadgeProgressRow = {
  badgeType: BadgeType
  currentCount: number
  targetCount: number
  weekKey: string | null
  updatedAt: Date
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findOrThrow(userId: string): Promise<User> {
    const user = await this.usersRepo.findById(userId)
    if (!user) throw new NotFoundException(`User ${userId} not found`)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email)
  }

  async getStats(userId: string): Promise<UserStats | null> {
    return this.usersRepo.findStats(userId)
  }

  async findUsersAtRisk(yesterday: Date, today: Date) {
    return this.usersRepo.findUsersAtRisk(yesterday, today)
  }

  async listSalesRepSummaries() {
    const users = await this.usersRepo.findSalesReps()
    return users.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      totalXP: u.stats?.totalXP ?? 0,
      level: u.stats?.level ?? 1,
      currentStreak: u.stats?.currentStreak ?? 0,
      longestStreak: u.stats?.longestStreak ?? 0,
      badgeCount: new Set(u.badgeAwards.map((b) => b.badgeType)).size,
      eventCount: (u as any).eventCount ?? 0,
      lastActivityAt: u.stats?.lastActivityDate ?? null,
    }))
  }

  async getProfile(userId: string) {
    const user = await this.findOrThrow(userId)
    const stats = await this.usersRepo.findStats(userId)
    const earned = await this.usersRepo.findBadgeAwards(userId)
    const inProgress = await this.usersRepo.findBadgeProgressInProgress(userId)

    const earnedTypes = new Set(earned.map((b) => b.badgeType))
    const earnedBadges = this.aggregateEarnedBadges(earned)
    const inProgressBadges = this.aggregateInProgressBadges(
      inProgress,
      currentIsoWeek(),
      earnedTypes,
    )
    const inProgressTypes = new Set(inProgressBadges.map((b) => b.type as BadgeType))
    const lockedBadges = this.buildLockedBadges(earnedTypes, inProgressTypes)

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      stats: stats
        ? {
            totalXP: stats.totalXP,
            totalPoints: stats.totalPoints,
            level: stats.level,
            currentStreak: stats.currentStreak,
            longestStreak: stats.longestStreak,
          }
        : null,
      badges: { earned: earnedBadges, inProgress: inProgressBadges, locked: lockedBadges },
    }
  }

  async getTimeline(userId: string, limit = 20, offset = 0) {
    const [entries, total] = await this.usersRepo.findTimeline(userId, limit, offset)

    const timeline = entries.map((e) => {
      const badgeDef = e.badgeType ? getBadgeDefinition(e.badgeType) : null
      return {
        id: e.id,
        type: e.type,
        badgeType: e.badgeType,
        displayName: badgeDef?.displayName,
        iconUrl: badgeDef?.iconUrl,
        pointsSnapshot: e.pointsSnapshot,
        xpSnapshot: e.xpSnapshot,
        levelSnapshot: e.levelSnapshot,
        weekKey: e.weekKey,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }
    })

    return { timeline, total, limit, offset }
  }

  async getEventFeed(
    userId: string,
    params: { from?: string; to?: string; limit?: number; offset?: number },
  ) {
    const limit = params.limit ?? 50
    const offset = params.offset ?? 0
    const [events, total] = await this.usersRepo.findEventFeed(userId, { ...params, limit, offset })
    return {
      events: events.map((e) => ({
        ...e,
        eventTypeDisplayName: getEventTypeDisplayName(e.eventType),
      })),
      total,
      limit,
      offset,
    }
  }

  private aggregateEarnedBadges(awards: BadgeAwardRow[]) {
    const byType = new Map<BadgeType, BadgeAwardRow[]>()

    for (const award of awards) {
      const list = byType.get(award.badgeType) ?? []
      list.push(award)
      byType.set(award.badgeType, list)
    }

    return Array.from(byType.entries()).map(([type, rows]) => {
      const def = getBadgeDefinition(type)!
      const latest = rows.reduce((a, b) => (a.awardedAt > b.awardedAt ? a : b))
      return {
        type,
        displayName: def.displayName,
        description: def.description,
        iconUrl: def.iconUrl,
        awardCount: rows.length,
        latestAwardedAt: latest.awardedAt,
        awardedAt: latest.awardedAt,
      }
    })
  }

  private aggregateInProgressBadges(
    progressRows: BadgeProgressRow[],
    week: string,
    earnedTypes: Set<BadgeType>,
  ) {
    const byType = new Map<BadgeType, BadgeProgressRow>()

    for (const row of progressRows) {
      const def = getBadgeDefinition(row.badgeType)
      if (def?.repeatPolicy === 'once' && earnedTypes.has(row.badgeType)) {
        continue
      }

      const existing = byType.get(row.badgeType)
      if (!existing) {
        byType.set(row.badgeType, row)
        continue
      }

      byType.set(row.badgeType, this.pickPreferredProgressRow(existing, row, week))
    }

    return Array.from(byType.values()).map((p) => {
      const def = getBadgeDefinition(p.badgeType)!
      return {
        type: p.badgeType,
        displayName: def.displayName,
        description: def.description,
        iconUrl: def.iconUrl,
        currentCount: p.currentCount,
        targetCount: p.targetCount,
        progressPercent: Math.round((p.currentCount / p.targetCount) * 100),
        weekKey: p.weekKey,
      }
    })
  }

  private pickPreferredProgressRow(a: BadgeProgressRow, b: BadgeProgressRow, week: string) {
    if (a.weekKey === week) return a
    if (b.weekKey === week) return b
    const aRatio = a.currentCount / a.targetCount
    const bRatio = b.currentCount / b.targetCount
    if (aRatio !== bRatio) return aRatio > bRatio ? a : b
    return a.updatedAt > b.updatedAt ? a : b
  }

  private buildLockedBadges(earnedTypes: Set<BadgeType>, inProgressTypes: Set<BadgeType>) {
    return BADGE_DEFINITIONS.filter(
      (d) => !earnedTypes.has(d.type) && !inProgressTypes.has(d.type),
    ).map((d) => ({
      type: d.type,
      displayName: d.displayName,
      description: d.description,
      iconUrl: d.iconUrl,
      locked: true,
    }))
  }
}
