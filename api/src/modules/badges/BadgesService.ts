import { Injectable } from '@nestjs/common'
import { BadgeType, EventType } from '@db'
import type { TxClient } from '../../common/prisma/types'
import { BADGE_DEFINITIONS } from './badgeDefinitions'
import { BadgesRepository } from './BadgesRepository'

export interface BadgeResult {
  unlocked: BadgeType[]
}

@Injectable()
export class BadgesService {
  constructor(private readonly badgesRepo: BadgesRepository) {}

  async evaluate(
    tx: TxClient,
    userId: string,
    eventType: EventType,
    isoWeek: string,
    currentStreak: number,
  ): Promise<BadgeResult> {
    const earned = await this.badgesRepo.findBadgeAwards(tx, userId)
    const earnedSet = new Set(earned.map((b) => b.badgeType))
    const unlocked: BadgeType[] = []

    const relevantDefs = BADGE_DEFINITIONS.filter((def) => {
      if (earnedSet.has(def.type)) return false
      if (def.type === BadgeType.HOT_STREAK) return true
      return def.eventTypes.includes(eventType)
    })

    for (const def of relevantDefs) {
      if (def.type === BadgeType.HOT_STREAK) {
        if (!def.evaluate(currentStreak)) continue

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

        await this.badgesRepo.createBadgeAward(tx, userId, def.type)
        unlocked.push(def.type)
        continue
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

      if (def.evaluate(progress.currentCount)) {
        await this.badgesRepo.createBadgeAward(tx, userId, def.type)
        await this.badgesRepo.updateBadgeProgress(tx, progress.id, { isCompleted: true })
        unlocked.push(def.type)
      }
    }

    return { unlocked }
  }
}
