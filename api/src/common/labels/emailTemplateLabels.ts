import type { EmailTemplateId } from '../../modules/notifications/emailTemplates'

export type EmailTemplateLabel = {
  displayName: string
  shortName: string
}

const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateId, EmailTemplateLabel> = {
  BADGE_UNLOCK: { displayName: 'Badge Unlock', shortName: 'Badge Unlock' },
  LEVEL_UP: { displayName: 'Level Up', shortName: 'Level Up' },
  NEAR_BADGE: { displayName: 'Near Badge', shortName: 'Near Badge' },
  STREAK_RISK: { displayName: 'Streak Risk', shortName: 'Streak Risk' },
  STREAK_BROKEN: { displayName: 'Streak Broken', shortName: 'Streak Broken' },
  WEEKLY_REP_DIGEST: { displayName: 'Weekly Rep Digest', shortName: 'Weekly Rep Digest' },
  END_OF_WEEK_PUSH: { displayName: 'End Of Week Push', shortName: 'End Of Week Push' },
  TOP_OF_WEEK_AWARD: { displayName: 'Top Of Week Award', shortName: 'Top Of Week Award' },
  WEEKLY_MGR_DIGEST: { displayName: 'Weekly Manager Digest', shortName: 'Weekly Manager Digest' },
}

export function getEmailTemplateLabel(templateId: EmailTemplateId | string): EmailTemplateLabel {
  const key = templateId as EmailTemplateId
  return EMAIL_TEMPLATE_LABELS[key] ?? { displayName: String(templateId), shortName: String(templateId) }
}

export function getEmailTemplateDisplayName(templateId: EmailTemplateId | string): string {
  return getEmailTemplateLabel(templateId).displayName
}
