import type { ComponentType } from 'react'
import EmailBadgeUnlock from './templates/EmailBadgeUnlock'
import EmailStreakRisk from './templates/EmailStreakRisk'
import EmailLevelUp from './templates/EmailLevelUp'
import EmailStreakBroken from './templates/EmailStreakBroken'
import EmailNearBadge from './templates/EmailNearBadge'
import EmailWeeklyRepDigest from './templates/EmailWeeklyRepDigest'
import EmailEndOfWeekPush from './templates/EmailEndOfWeekPush'
import EmailTopOfWeekAward from './templates/EmailTopOfWeekAward'
import EmailWeeklyMgrDigest from './templates/EmailWeeklyMgrDigest'

export type EmailTemplateId =
  | 'BADGE_UNLOCK'
  | 'STREAK_RISK'
  | 'LEVEL_UP'
  | 'STREAK_BROKEN'
  | 'NEAR_BADGE'
  | 'WEEKLY_REP_DIGEST'
  | 'END_OF_WEEK_PUSH'
  | 'TOP_OF_WEEK_AWARD'
  | 'WEEKLY_MGR_DIGEST'

export const emailTemplateComponents: Record<
  EmailTemplateId,
  ComponentType<{ recipientName?: string }>
> = {
  BADGE_UNLOCK: EmailBadgeUnlock,
  STREAK_RISK: EmailStreakRisk,
  LEVEL_UP: EmailLevelUp,
  STREAK_BROKEN: EmailStreakBroken,
  NEAR_BADGE: EmailNearBadge,
  WEEKLY_REP_DIGEST: EmailWeeklyRepDigest,
  END_OF_WEEK_PUSH: EmailEndOfWeekPush,
  TOP_OF_WEEK_AWARD: EmailTopOfWeekAward,
  WEEKLY_MGR_DIGEST: EmailWeeklyMgrDigest,
}

