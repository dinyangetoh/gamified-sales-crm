import type { EmailTemplateId } from './emailTemplates'

export type ListNotificationLogsParams = {
  type?: string
  from?: Date
  to?: Date
  limit: number
  offset: number
}

export type SendTestEmailParams = {
  templateId: EmailTemplateId
  toEmail: string
  actorUserId: string
  userId?: string
  week?: string
}

export type BadgeUnlockTestEmailParams = {
  templateId: EmailTemplateId
  toEmail: string
  actorUserId: string
  userId?: string
}
