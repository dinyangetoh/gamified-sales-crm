import { BadgeType, EventType } from '@db'

export type BadgeRepeatPolicy = 'once' | 'per_iso_week' | 'repeatable_lifetime'

export interface BadgeDefinition {
  type: BadgeType
  displayName: string
  description: string
  iconUrl: string
  targetCount: number
  windowType: 'lifetime' | 'iso_week'
  repeatPolicy: BadgeRepeatPolicy
  eventTypes: EventType[]
  evaluate: (currentCount: number) => boolean
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: BadgeType.FIRST_WIN,
    displayName: 'First Win',
    description: 'Close your first deal.',
    iconUrl: '/badges/first-win.svg',
    targetCount: 1,
    windowType: 'lifetime',
    repeatPolicy: 'once',
    eventTypes: [EventType.DEAL_WON],
    evaluate: (count) => count >= 1,
  },
  {
    type: BadgeType.CONSISTENT_CLOSER,
    displayName: 'Consistent Closer',
    description: 'Close 3 deals in a single week.',
    iconUrl: '/badges/consistent-closer.svg',
    targetCount: 3,
    windowType: 'iso_week',
    repeatPolicy: 'per_iso_week',
    eventTypes: [EventType.DEAL_WON],
    evaluate: (count) => count >= 3,
  },
  {
    type: BadgeType.PIPELINE_BUILDER,
    displayName: 'Pipeline Builder',
    description: 'Advance 5 deals through stages in a single week.',
    iconUrl: '/badges/pipeline-builder.svg',
    targetCount: 5,
    windowType: 'iso_week',
    repeatPolicy: 'per_iso_week',
    eventTypes: [EventType.STAGE_ADVANCED],
    evaluate: (count) => count >= 5,
  },
  {
    type: BadgeType.HOT_STREAK,
    displayName: 'Hot Streak',
    description: 'Log activity 5 days in a row.',
    iconUrl: '/badges/hot-streak.svg',
    targetCount: 5,
    windowType: 'lifetime',
    repeatPolicy: 'repeatable_lifetime',
    eventTypes: [],
    evaluate: (count) => count >= 5,
  },
  {
    type: BadgeType.TOP_OF_THE_WEEK,
    displayName: 'Top of the Week',
    description: 'Finish #1 on the leaderboard at end of week.',
    iconUrl: '/badges/top-of-week.svg',
    targetCount: 1,
    windowType: 'iso_week',
    repeatPolicy: 'per_iso_week',
    eventTypes: [],
    evaluate: (count) => count >= 1,
  },
  {
    type: BadgeType.COMEBACK_KID,
    displayName: 'Comeback Kid',
    description: 'Bounce back with a better week after a down week.',
    iconUrl: '/badges/comeback-kid.svg',
    targetCount: 1,
    windowType: 'iso_week',
    repeatPolicy: 'per_iso_week',
    eventTypes: [],
    evaluate: (count) => count >= 1,
  },
]

export function getBadgeDefinition(type: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((d) => d.type === type)
}
