import { BadgeType } from '@db'
import { BADGE_DEFINITIONS, getBadgeDefinition } from '../badges/badgeDefinitions'

type BadgeAwardRow = { badgeType: BadgeType; awardedAt: Date; weekKey?: string | null }
type BadgeProgressRow = {
  badgeType: BadgeType
  currentCount: number
  targetCount: number
  weekKey: string | null
  updatedAt: Date
}

export function aggregateEarnedBadges(awards: BadgeAwardRow[]) {
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

export function aggregateInProgressBadges(
  progressRows: BadgeProgressRow[],
  currentIsoWeek: string,
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

    const pickCurrentWeek = (a: BadgeProgressRow, b: BadgeProgressRow) => {
      if (a.weekKey === currentIsoWeek) return a
      if (b.weekKey === currentIsoWeek) return b
      const aRatio = a.currentCount / a.targetCount
      const bRatio = b.currentCount / b.targetCount
      if (aRatio !== bRatio) return aRatio > bRatio ? a : b
      return a.updatedAt > b.updatedAt ? a : b
    }

    byType.set(row.badgeType, pickCurrentWeek(existing, row))
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

export function buildLockedBadges(earnedTypes: Set<BadgeType>, inProgressTypes: Set<BadgeType>) {
  return BADGE_DEFINITIONS.filter((d) => !earnedTypes.has(d.type) && !inProgressTypes.has(d.type)).map(
    (d) => ({
      type: d.type,
      displayName: d.displayName,
      description: d.description,
      iconUrl: d.iconUrl,
      locked: true,
    }),
  )
}
