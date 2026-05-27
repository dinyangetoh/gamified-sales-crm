import { BadgeType } from '@db'
import { getBadgeDefinition } from '../../../modules/badges/badgeDefinitions'

export type BadgeDisplayDto = {
  type: BadgeType
  displayName: string
  iconUrl: string
}

export function dedupeBadgeAwards(
  awards: Array<{ badgeType: BadgeType }>,
): BadgeDisplayDto[] {
  const seen = new Set<BadgeType>()
  const badges: BadgeDisplayDto[] = []
  for (const b of awards) {
    if (seen.has(b.badgeType)) continue
    seen.add(b.badgeType)
    const def = getBadgeDefinition(b.badgeType)!
    badges.push({ type: b.badgeType, displayName: def.displayName, iconUrl: def.iconUrl })
  }
  return badges
}

export function mapUnlockedBadgesToDisplay(types: BadgeType[]): BadgeDisplayDto[] {
  return types.map((type) => {
    const def = getBadgeDefinition(type)!
    return { type, displayName: def.displayName, iconUrl: def.iconUrl }
  })
}
