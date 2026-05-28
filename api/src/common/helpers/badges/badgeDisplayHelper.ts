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
  const seenBadgeTypes = new Set<BadgeType>()
  const badgeDisplayDtos: BadgeDisplayDto[] = []
  for (const badgeAward of awards) {
    if (seenBadgeTypes.has(badgeAward.badgeType)) continue
    seenBadgeTypes.add(badgeAward.badgeType)
    const badgeDefinition = getBadgeDefinition(badgeAward.badgeType)!
    badgeDisplayDtos.push({
      type: badgeAward.badgeType,
      displayName: badgeDefinition.displayName,
      iconUrl: badgeDefinition.iconUrl,
    })
  }
  return badgeDisplayDtos
}

export function mapUnlockedBadgesToDisplay(types: BadgeType[]): BadgeDisplayDto[] {
  return types.map((type) => {
    const badgeDefinition = getBadgeDefinition(type)!
    return { type, displayName: badgeDefinition.displayName, iconUrl: badgeDefinition.iconUrl }
  })
}
