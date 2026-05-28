import { Injectable, Logger } from '@nestjs/common'
import { BadgeType, EventType } from '@db'
import type { TxClient } from '../../common/prisma/types'
import { BADGE_DEFINITIONS, type BadgeDefinition } from './badgeDefinitions'
import { BadgesRepository } from './BadgesRepository'
import type { BadgeResult } from './IBadgesService'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name)

  constructor(private readonly badgesRepo: BadgesRepository) {}

  async evaluate(
    tx: TxClient,
    userId: string,
    eventType: EventType,
    isoWeek: string,
    currentStreak: number,
    eventAt: Date = new Date(),
  ): Promise<BadgeResult> {
    try {
      const unlocked: BadgeType[] = []

      const relevantDefs = BADGE_DEFINITIONS.filter((def) => {
        if (def.type === BadgeType.HOT_STREAK) return true
        return def.eventTypes.includes(eventType)
      })

      for (const def of relevantDefs) {
        const earned = await this.tryUnlockBadge(tx, userId, def, isoWeek, currentStreak, eventAt)
        if (earned) unlocked.push(def.type)
      }

      return { unlocked }
    } catch (error) {
      handleServiceError(this.logger, error, {
        service: BadgesService.name,
        method: 'evaluate',
        operation: 'evaluateBadgeUnlocks',
        safeMessage: 'Unable to evaluate badge progress right now.',
        metadata: { userId, eventType, isoWeek },
      })
    }
  }

  private async tryUnlockBadge(
    tx: TxClient,
    userId: string,
    def: BadgeDefinition,
    isoWeek: string,
    currentStreak: number,
    eventAt: Date,
  ): Promise<boolean> {
    if (def.type === BadgeType.HOT_STREAK) {
      return this.tryUnlockHotStreak(tx, userId, def, currentStreak, eventAt)
    }

    if (await this.isAlreadyAwardedForPeriod(tx, userId, def, isoWeek)) {
      return false
    }

    const weekKey = def.windowType === 'iso_week' ? isoWeek : null

    let progress: { id: string; currentCount: number; isCompleted: boolean }

    if (weekKey !== null) {
      progress = await this.badgesRepo.upsertBadgeProgress(
        tx,
        userId,
        def.type,
        weekKey,
        def.targetCount,
      )
    } else {
      const existing = await this.badgesRepo.findBadgeProgress(tx, userId, def.type, null)
      if (existing) {
        progress = await this.badgesRepo.updateBadgeProgress(tx, existing.id, {
          currentCount: existing.currentCount + 1,
        })
      } else {
        progress = await this.badgesRepo.createBadgeProgress(tx, {
          userId,
          badgeType: def.type,
          currentCount: 1,
          targetCount: def.targetCount,
          weekKey: null,
        })
      }
    }

    if (!def.evaluate(progress.currentCount)) {
      return false
    }

    if (await this.isAlreadyAwardedForPeriod(tx, userId, def, isoWeek)) {
      return false
    }

    await this.badgesRepo.createBadgeAward(tx, userId, def.type, weekKey, eventAt)
    await this.badgesRepo.updateBadgeProgress(tx, progress.id, { isCompleted: true })
    return true
  }

  private async tryUnlockHotStreak(
    tx: TxClient,
    userId: string,
    def: BadgeDefinition,
    currentStreak: number,
    eventAt: Date,
  ): Promise<boolean> {
    if (currentStreak !== def.targetCount) return false

    if (await this.badgesRepo.hasHotStreakAwardInCurrentStreak(tx, userId, currentStreak, eventAt)) {
      return false
    }

    const existing = await this.badgesRepo.findBadgeProgress(tx, userId, def.type, null)
    if (existing) {
      await this.badgesRepo.updateBadgeProgress(tx, existing.id, {
        currentCount: currentStreak,
      })
    } else {
      await this.badgesRepo.createBadgeProgress(tx, {
        userId,
        badgeType: def.type,
        currentCount: currentStreak,
        targetCount: def.targetCount,
        weekKey: null,
      })
    }

    await this.badgesRepo.createBadgeAward(tx, userId, def.type, null, eventAt)
    return true
  }

  private async isAlreadyAwardedForPeriod(
    tx: TxClient,
    userId: string,
    def: BadgeDefinition,
    isoWeek: string,
  ): Promise<boolean> {
    switch (def.repeatPolicy) {
      case 'once':
        return this.badgesRepo.hasBadgeAward(tx, userId, def.type)
      case 'per_iso_week':
        return this.badgesRepo.hasBadgeAwardForWeek(tx, userId, def.type, isoWeek)
      case 'repeatable_lifetime':
        return false
      default:
        return this.badgesRepo.hasBadgeAward(tx, userId, def.type)
    }
  }
}
