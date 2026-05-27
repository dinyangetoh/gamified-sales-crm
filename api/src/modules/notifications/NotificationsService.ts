import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { BadgeType } from '@db'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { NotificationsRepository } from './NotificationsRepository'
import { EMAIL_TEMPLATES, type EmailTemplateId, getEmailTemplateById } from './emailTemplates'

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name)
  private resend: Resend | null = null
  private emailEnabled = false

  constructor(
    private readonly config: ConfigService,
    private readonly notificationsRepo: NotificationsRepository,
  ) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('RESEND_API_KEY')
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured — email notifications disabled. ' +
          'Set RESEND_API_KEY in .env to enable.',
      )
      return
    }
    this.resend = new Resend(apiKey)
    this.emailEnabled = true
  }

  async sendBadgeUnlock(userId: string, badgeType: BadgeType): Promise<void> {
    const user = await this.notificationsRepo.findUserById(userId)
    if (!user) return

    const def = BADGE_DEFINITIONS.find((d) => d.type === badgeType)

    await this.notificationsRepo.createNotificationLog({
      userId,
      type: 'BADGE_UNLOCK',
      metadata: { badgeType, displayName: def?.displayName },
    })

    if (!this.emailEnabled || !this.resend) {
      this.logger.debug({ userId, badgeType }, 'Email skipped — no API key')
      return
    }

    await this.resend.emails.send({
      from: 'gamification@yourdomain.com',
      to: user.email,
      subject: `🏆 You earned the "${def?.displayName}" badge!`,
      html: `<p>Congratulations ${user.name}! You just unlocked the <strong>${def?.displayName}</strong> badge.</p><p>${def?.description}</p>`,
    })
  }

  async sendStreakRisk(userId: string, streak: number): Promise<void> {
    const user = await this.notificationsRepo.findUserById(userId)
    if (!user) return

    await this.notificationsRepo.createNotificationLog({
      userId,
      type: 'STREAK_RISK',
      metadata: { streak },
    })

    if (!this.emailEnabled || !this.resend) {
      this.logger.debug({ userId, streak }, 'Email skipped — no API key')
      return
    }

    await this.resend.emails.send({
      from: 'gamification@yourdomain.com',
      to: user.email,
      subject: `🔥 Your ${streak}-day streak is at risk!`,
      html: `<p>Hi ${user.name}, log an activity today to keep your ${streak}-day streak alive!</p>`,
    })
  }

  async hasNotificationToday(userId: string, type: string): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const existing = await this.notificationsRepo.findNotificationToday(
      userId,
      type,
      today,
      tomorrow,
    )
    return !!existing
  }

  async listNotificationLogs(params: {
    type?: string
    from?: Date
    to?: Date
    limit: number
    offset: number
  }) {
    const [items, total] = await this.notificationsRepo.findNotificationLogs(params)
    return { items, total, limit: params.limit, offset: params.offset }
  }

  async sendTestEmail(params: {
    templateId: EmailTemplateId
    toEmail: string
    // The manager calling the endpoint. Used as a fallback for notification-log userId.
    actorUserId: string
    // Optional target user for personalization + notification-log ownership.
    userId?: string
    week?: string
  }): Promise<{ accepted: boolean }> {
    const template = getEmailTemplateById(params.templateId)
    if (!template) return { accepted: false }

    const effectiveUserId = params.userId ?? params.actorUserId
    const user = await this.notificationsRepo.findUserById(effectiveUserId)
    if (!user) return { accepted: false }

    const from = 'gamification@yourdomain.com'

    if (params.templateId === 'BADGE_UNLOCK') {
      const badgeType = template.defaultBadgeType ?? ('CONSISTENT_CLOSER' as BadgeType)
      const def = BADGE_DEFINITIONS.find((d) => d.type === badgeType)

      await this.notificationsRepo.createNotificationLog({
        userId: effectiveUserId,
        type: params.templateId,
        metadata: { badgeType, displayName: def?.displayName, toEmail: params.toEmail },
      })

      if (!this.emailEnabled || !this.resend) {
        this.logger.debug({ toEmail: params.toEmail, templateId: params.templateId }, 'Test email skipped — no API key')
        return { accepted: true }
      }

      await this.resend.emails.send({
        from,
        to: params.toEmail,
        subject: `🏆 You earned the "${def?.displayName ?? badgeType}" badge!`,
        html: `<p>Congratulations ${user.name}! You just unlocked the <strong>${
          def?.displayName ?? badgeType
        }</strong> badge.</p><p>${def?.description ?? ''}</p>`,
      })

      return { accepted: true }
    }

    if (params.templateId === 'STREAK_RISK') {
      const streak = template.defaultStreak ?? 5

      await this.notificationsRepo.createNotificationLog({
        userId: effectiveUserId,
        type: params.templateId,
        metadata: { streak, toEmail: params.toEmail },
      })

      if (!this.emailEnabled || !this.resend) {
        this.logger.debug({ toEmail: params.toEmail, templateId: params.templateId }, 'Test email skipped — no API key')
        return { accepted: true }
      }

      await this.resend.emails.send({
        from,
        to: params.toEmail,
        subject: `🔥 Your ${streak}-day streak is at risk!`,
        html: `<p>Hi ${user.name}, log an activity today to keep your ${streak}-day streak alive!</p>`,
      })

      return { accepted: true }
    }

    // MVP templates can be previewed in the UI, but sending is not supported yet.
    return { accepted: false }
  }
}
