import type { BadgeType } from '@db'

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

export type EmailTemplateRole = 'rep' | 'manager'
export type EmailTemplateStatus = 'poc' | 'mvp'

export type EmailTemplateRegistryItem = {
  templateId: EmailTemplateId
  role: EmailTemplateRole
  status: EmailTemplateStatus
  trigger: string
  defaultSubject: string
  resendTemplateId?: string
  resendLink?: string

  // Optional defaults for test rendering/sending (used for POC templates first).
  defaultBadgeType?: BadgeType
  defaultStreak?: number
}

export const EMAIL_TEMPLATES: EmailTemplateRegistryItem[] = [
  {
    templateId: 'BADGE_UNLOCK',
    role: 'rep',
    status: 'poc',
    trigger: 'When a rep unlocks a badge',
    defaultSubject: '🏆 You earned your badge',
    defaultBadgeType: 'CONSISTENT_CLOSER',
  },
  {
    templateId: 'STREAK_RISK',
    role: 'rep',
    status: 'poc',
    trigger: 'When a rep streak is at risk',
    defaultSubject: '🔥 Your streak is at risk',
    defaultStreak: 5,
  },
  {
    templateId: 'LEVEL_UP',
    role: 'rep',
    status: 'mvp',
    trigger: 'When a rep levels up',
    defaultSubject: "You're now a higher tier",
  },
  {
    templateId: 'STREAK_BROKEN',
    role: 'rep',
    status: 'mvp',
    trigger: 'When a rep streak breaks',
    defaultSubject: 'Your streak has reset',
  },
  {
    templateId: 'NEAR_BADGE',
    role: 'rep',
    status: 'mvp',
    trigger: 'When badge progress reaches >= 80%',
    defaultSubject: 'One step closer to a new badge',
  },
  {
    templateId: 'WEEKLY_REP_DIGEST',
    role: 'rep',
    status: 'mvp',
    trigger: 'Weekly recap for reps',
    defaultSubject: 'This week on Rally',
  },
  {
    templateId: 'END_OF_WEEK_PUSH',
    role: 'rep',
    status: 'mvp',
    trigger: 'End-of-week “push” nudge',
    defaultSubject: 'Last-chance push',
  },
  {
    templateId: 'TOP_OF_WEEK_AWARD',
    role: 'rep',
    status: 'mvp',
    trigger: 'When a rep finishes #1 this week',
    defaultSubject: 'You won the week',
  },
  {
    templateId: 'WEEKLY_MGR_DIGEST',
    role: 'manager',
    status: 'mvp',
    trigger: 'Weekly digest for managers',
    defaultSubject: 'Acme Sales · Weekly digest',
  },
]

export function getEmailTemplateById(templateId: EmailTemplateId): EmailTemplateRegistryItem | undefined {
  return EMAIL_TEMPLATES.find((t) => t.templateId === templateId)
}

