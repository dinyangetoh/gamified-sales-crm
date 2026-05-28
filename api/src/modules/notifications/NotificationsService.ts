import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { BadgeType, User } from '@db'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'
import { NotificationsRepository } from './NotificationsRepository'
import { EMAIL_TEMPLATES, type EmailTemplateId, getEmailTemplateById } from './emailTemplates'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'
import type {
  BadgeUnlockTestEmailParams,
  ListNotificationLogsParams,
  SendTestEmailParams,
} from './INotificationsService'

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name)
  private resend: Resend | null = null
  private emailEnabled = false

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  onModuleInit(): void {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')
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
    try {
      const user = await this.notificationsRepository.findUserById(userId)
      if (!user) return

      const badgeDefinition = BADGE_DEFINITIONS.find(
        (candidateBadgeDefinition) => candidateBadgeDefinition.type === badgeType,
      )

      await this.notificationsRepository.createNotificationLog({
        userId,
        type: 'BADGE_UNLOCK',
        metadata: { badgeType, displayName: badgeDefinition?.displayName },
      })

      if (!this.emailEnabled || !this.resend) {
        this.logger.debug({ userId, badgeType }, 'Email skipped — no API key')
        return
      }

      await this.resend.emails.send({
        from: 'gamification@yourdomain.com',
        to: user.email,
        subject: `🏆 You earned the "${badgeDefinition?.displayName}" badge!`,
        html: `<p>Congratulations ${user.name}! You just unlocked the <strong>${badgeDefinition?.displayName}</strong> badge.</p><p>${badgeDefinition?.description}</p>`,
      })
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: NotificationsService.name,
        method: 'sendBadgeUnlock',
        operation: 'sendBadgeUnlockNotification',
        safeMessage: 'Unable to send badge unlock notification right now.',
        metadata: { userId, badgeType },
      })
    }
  }

  async sendStreakRisk(userId: string, streak: number): Promise<void> {
    try {
      const user = await this.notificationsRepository.findUserById(userId)
      if (!user) return

      await this.notificationsRepository.createNotificationLog({
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
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: NotificationsService.name,
        method: 'sendStreakRisk',
        operation: 'sendStreakRiskNotification',
        safeMessage: 'Unable to send streak-risk notification right now.',
        metadata: { userId, streak },
      })
    }
  }

  async hasNotificationToday(userId: string, type: string): Promise<boolean> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    try {
      const existing = await this.notificationsRepository.findNotificationToday(
        userId,
        type,
        today,
        tomorrow,
      )
      return !!existing
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: NotificationsService.name,
        method: 'hasNotificationToday',
        operation: 'findNotificationToday',
        safeMessage: 'Unable to verify notification status right now.',
        metadata: { userId, type },
      })
    }
  }

  async listNotificationLogs(
    params: ListNotificationLogsParams,
  ): Promise<{ items: Awaited<ReturnType<NotificationsRepository['findNotificationLogs']>>[0]; total: number; limit: number; offset: number }> {
    try {
      const [items, total] = await this.notificationsRepository.findNotificationLogs(params)
      return { items, total, limit: params.limit, offset: params.offset }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: NotificationsService.name,
        method: 'listNotificationLogs',
        operation: 'findNotificationLogs',
        safeMessage: 'Unable to load notification logs right now.',
        metadata: params,
      })
    }
  }

  async sendTestEmail(params: SendTestEmailParams): Promise<{ accepted: boolean }> {
    try {
      const template = getEmailTemplateById(params.templateId)
      if (!template) return { accepted: false }

      const effectiveUserId = params.userId ?? params.actorUserId
      const user = await this.notificationsRepository.findUserById(effectiveUserId)
      if (!user) return { accepted: false }

      if (params.templateId === 'BADGE_UNLOCK') {
        return this.sendBadgeUnlockTestEmail(params, user, template.defaultBadgeType)
      }

      if (params.templateId === 'STREAK_RISK') {
        return this.sendStreakRiskTestEmail(params, user, template.defaultStreak ?? 5)
      }

      return { accepted: false }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: NotificationsService.name,
        method: 'sendTestEmail',
        operation: 'sendTestNotificationEmail',
        safeMessage: 'Unable to send test notification email right now.',
        metadata: { templateId: params.templateId, toEmail: params.toEmail },
      })
    }
  }

  private async sendBadgeUnlockTestEmail(
    params: BadgeUnlockTestEmailParams,
    user: User,
    badgeType: BadgeType = 'CONSISTENT_CLOSER' as BadgeType,
  ): Promise<{ accepted: boolean }> {
    const effectiveUserId = params.userId ?? params.actorUserId
    const badgeDefinition = BADGE_DEFINITIONS.find(
      (candidateBadgeDefinition) => candidateBadgeDefinition.type === badgeType,
    )

    await this.notificationsRepository.createNotificationLog({
      userId: effectiveUserId,
      type: params.templateId,
      metadata: { badgeType, displayName: badgeDefinition?.displayName, toEmail: params.toEmail },
    })

    const sent = await this.sendEmailIfEnabled(
      params.toEmail,
      params.templateId,
      `🏆 You earned the "${badgeDefinition?.displayName ?? badgeType}" badge!`,
      `<p>Congratulations ${user.name}! You just unlocked the <strong>${
        badgeDefinition?.displayName ?? badgeType
      }</strong> badge.</p><p>${badgeDefinition?.description ?? ''}</p>`,
    )

    return { accepted: sent ?? true }
  }

  private async sendStreakRiskTestEmail(
    params: BadgeUnlockTestEmailParams,
    user: User,
    streak: number,
  ): Promise<{ accepted: boolean }> {
    const effectiveUserId = params.userId ?? params.actorUserId

    await this.notificationsRepository.createNotificationLog({
      userId: effectiveUserId,
      type: params.templateId,
      metadata: { streak, toEmail: params.toEmail },
    })

    const sent = await this.sendEmailIfEnabled(
      params.toEmail,
      params.templateId,
      `🔥 Your ${streak}-day streak is at risk!`,
      `<p>Hi ${user.name}, log an activity today to keep your ${streak}-day streak alive!</p>`,
    )

    return { accepted: sent ?? true }
  }

  private async sendEmailIfEnabled(
    toEmail: string,
    templateId: string,
    subject: string,
    html: string,
  ): Promise<boolean | undefined> {
    if (!this.emailEnabled || !this.resend) {
      this.logger.debug({ toEmail, templateId }, 'Test email skipped — no API key')
      return undefined
    }

    await this.resend.emails.send({
      from: 'gamification@yourdomain.com',
      to: toEmail,
      subject,
      html,
    })
    return true
  }
}
