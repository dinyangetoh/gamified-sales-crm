import { Injectable } from '@nestjs/common'
import { BadgeType, EventType } from '@db'
import { Prisma } from '@db'
import { BADGE_DEFINITIONS } from './badgeDefinitions'

export interface BadgeResult {
  unlocked: BadgeType[]
}

type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

@Injectable()
export class BadgesService {
  async evaluate(
    tx: TxClient,
    userId: string,
    eventType: EventType,
    isoWeek: string,
    currentStreak: number,
  ): Promise<BadgeResult> {
    const earned = await tx.badgeAward.findMany({ where: { userId } })
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

        const existing = await tx.badgeProgress.findFirst({
          where: { userId, badgeType: def.type, weekKey: null },
        })
        if (existing) {
          await tx.badgeProgress.update({
            where: { id: existing.id },
            data: { currentCount: currentStreak },
          })
        } else {
          await tx.badgeProgress.create({
            data: { userId, badgeType: def.type, currentCount: currentStreak, targetCount: def.targetCount, weekKey: null },
          })
        }

        await tx.badgeAward.create({ data: { userId, badgeType: def.type } })
        unlocked.push(def.type)
        continue
      }

      const weekKey = def.windowType === 'iso_week' ? isoWeek : null

      let progress: { id: string; currentCount: number; isCompleted: boolean }

      if (weekKey !== null) {
        progress = await tx.badgeProgress.upsert({
          where: { userId_badgeType_weekKey: { userId, badgeType: def.type, weekKey } },
          create: { userId, badgeType: def.type, currentCount: 1, targetCount: def.targetCount, weekKey },
          update: { currentCount: { increment: 1 } },
        })
      } else {
        const existing = await tx.badgeProgress.findFirst({
          where: { userId, badgeType: def.type, weekKey: null },
        })
        if (existing) {
          progress = await tx.badgeProgress.update({
            where: { id: existing.id },
            data: { currentCount: { increment: 1 } },
          })
        } else {
          progress = await tx.badgeProgress.create({
            data: { userId, badgeType: def.type, currentCount: 1, targetCount: def.targetCount, weekKey: null },
          })
        }
      }

      if (def.evaluate(progress.currentCount)) {
        await tx.badgeAward.create({ data: { userId, badgeType: def.type } })
        await tx.badgeProgress.update({ where: { id: progress.id }, data: { isCompleted: true } })
        unlocked.push(def.type)
      }
    }

    return { unlocked }
  }
}
