import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { BadgeType } from '@db'
import { PrismaService } from '../../common/prisma/PrismaService'
import { BADGE_DEFINITIONS } from '../badges/badgeDefinitions'

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name)
  private resend: Resend | null = null
  private emailEnabled = false

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return

    const def = BADGE_DEFINITIONS.find((d) => d.type === badgeType)

    await this.prisma.notificationLog.create({
      data: {
        userId,
        type: 'BADGE_UNLOCK',
        metadata: { badgeType, displayName: def?.displayName },
      },
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return

    await this.prisma.notificationLog.create({
      data: { userId, type: 'STREAK_RISK', metadata: { streak } },
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

    const existing = await this.prisma.notificationLog.findFirst({
      where: { userId, type, sentAt: { gte: today, lt: tomorrow } },
    })
    return !!existing
  }
}
