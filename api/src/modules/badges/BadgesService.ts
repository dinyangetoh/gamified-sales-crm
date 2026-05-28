import { Injectable, Logger } from '@nestjs/common'
import { BadgeType, EventType } from '@db'
import type { TxClient } from '../../common/prisma/types'
import {
  BADGE_DEFINITIONS,
  BadgeRepeatPolicy,
  BadgeWindowType,
  type BadgeDefinition,
} from './badgeDefinitions'
import { BadgesRepository } from './BadgesRepository'
import type { BadgeResult } from './IBadgesService'
import { handleServiceError } from '../../common/errors/ServiceErrorHandler'

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name)

  constructor(private readonly badgesRepo: BadgesRepository) {}

  async evaluate(
    txClient: TxClient,
    userId: string,
    eventType: EventType,
    isoWeek: string,
    currentStreak: number,
    eventAt: Date = new Date(),
  ): Promise<BadgeResult> {
    try {
      const unlockedBadgeTypes: BadgeType[] = []

      const filteredBadgeDefinitions = BADGE_DEFINITIONS.filter((badgeDefinition) => {
        if (badgeDefinition.type === BadgeType.HOT_STREAK) return true
        return badgeDefinition.eventTypes.includes(eventType)
      })

      for (const badgeDefinition of filteredBadgeDefinitions) {
        const hasEarnedBadge = await this.tryUnlockBadge(
          txClient,
          userId,
          badgeDefinition,
          isoWeek,
          currentStreak,
          eventAt,
        )
        if (hasEarnedBadge) unlockedBadgeTypes.push(badgeDefinition.type)
      }

      return { unlocked: unlockedBadgeTypes }
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
    txClient: TxClient,
    userId: string,
    badgeDefinition: BadgeDefinition,
    isoWeek: string,
    currentStreak: number,
    eventAt: Date,
  ): Promise<boolean> {
    if (badgeDefinition.type === BadgeType.HOT_STREAK) {
      return this.tryUnlockHotStreak(txClient, userId, badgeDefinition, currentStreak, eventAt)
    }

    if (await this.isAlreadyAwardedForPeriod(txClient, userId, badgeDefinition, isoWeek)) {
      return false
    }

    const weekKey =
      badgeDefinition.windowType === BadgeWindowType.ISO_WEEK ? isoWeek : null

    let badgeProgressRecord: { id: string; currentCount: number; isCompleted: boolean }

    if (weekKey !== null) {
      badgeProgressRecord = await this.badgesRepo.upsertBadgeProgress(
        txClient,
        userId,
        badgeDefinition.type,
        weekKey,
        badgeDefinition.targetCount,
      )
    } else {
      const existingBadgeProgress = await this.badgesRepo.findBadgeProgress(
        txClient,
        userId,
        badgeDefinition.type,
        null,
      )
      if (existingBadgeProgress) {
        badgeProgressRecord = await this.badgesRepo.updateBadgeProgress(txClient, existingBadgeProgress.id, {
          currentCount: existingBadgeProgress.currentCount + 1,
        })
      } else {
        badgeProgressRecord = await this.badgesRepo.createBadgeProgress(txClient, {
          userId,
          badgeType: badgeDefinition.type,
          currentCount: 1,
          targetCount: badgeDefinition.targetCount,
          weekKey: null,
        })
      }
    }

    if (!badgeDefinition.evaluate(badgeProgressRecord.currentCount)) {
      return false
    }

    if (await this.isAlreadyAwardedForPeriod(txClient, userId, badgeDefinition, isoWeek)) {
      return false
    }

    await this.badgesRepo.createBadgeAward(txClient, userId, badgeDefinition.type, weekKey, eventAt)
    await this.badgesRepo.updateBadgeProgress(txClient, badgeProgressRecord.id, { isCompleted: true })
    return true
  }

  private async tryUnlockHotStreak(
    txClient: TxClient,
    userId: string,
    badgeDefinition: BadgeDefinition,
    currentStreak: number,
    eventAt: Date,
  ): Promise<boolean> {
    if (currentStreak !== badgeDefinition.targetCount) return false

    if (await this.badgesRepo.hasHotStreakAwardInCurrentStreak(txClient, userId, currentStreak, eventAt)) {
      return false
    }

    const existingBadgeProgress = await this.badgesRepo.findBadgeProgress(
      txClient,
      userId,
      badgeDefinition.type,
      null,
    )
    if (existingBadgeProgress) {
      await this.badgesRepo.updateBadgeProgress(txClient, existingBadgeProgress.id, {
        currentCount: currentStreak,
      })
    } else {
      await this.badgesRepo.createBadgeProgress(txClient, {
        userId,
        badgeType: badgeDefinition.type,
        currentCount: currentStreak,
        targetCount: badgeDefinition.targetCount,
        weekKey: null,
      })
    }

    await this.badgesRepo.createBadgeAward(txClient, userId, badgeDefinition.type, null, eventAt)
    return true
  }

  private async isAlreadyAwardedForPeriod(
    txClient: TxClient,
    userId: string,
    badgeDefinition: BadgeDefinition,
    isoWeek: string,
  ): Promise<boolean> {
    switch (badgeDefinition.repeatPolicy) {
      case BadgeRepeatPolicy.ONCE:
        return this.badgesRepo.hasBadgeAward(txClient, userId, badgeDefinition.type)
      case BadgeRepeatPolicy.PER_ISO_WEEK:
        return this.badgesRepo.hasBadgeAwardForWeek(txClient, userId, badgeDefinition.type, isoWeek)
      case BadgeRepeatPolicy.REPEATABLE_LIFETIME:
        return false
      default:
        return this.badgesRepo.hasBadgeAward(txClient, userId, badgeDefinition.type)
    }
  }
}
