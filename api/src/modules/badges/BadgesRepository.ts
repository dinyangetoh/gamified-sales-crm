import { Injectable } from '@nestjs/common'
import { BadgeType } from '@db'
import type { TxClient } from '../../common/prisma/types'

@Injectable()
export class BadgesRepository {
  findBadgeAwards(tx: TxClient, userId: string) {
    return tx.badgeAward.findMany({ where: { userId } })
  }

  findBadgeProgress(tx: TxClient, userId: string, badgeType: BadgeType, weekKey: string | null) {
    return tx.badgeProgress.findFirst({
      where: { userId, badgeType, weekKey },
    })
  }

  updateBadgeProgress(
    tx: TxClient,
    id: string,
    data: { currentCount?: number; isCompleted?: boolean },
  ) {
    return tx.badgeProgress.update({ where: { id }, data })
  }

  createBadgeProgress(
    tx: TxClient,
    data: {
      userId: string
      badgeType: BadgeType
      currentCount: number
      targetCount: number
      weekKey: string | null
    },
  ) {
    return tx.badgeProgress.create({ data })
  }

  upsertBadgeProgress(
    tx: TxClient,
    userId: string,
    badgeType: BadgeType,
    weekKey: string,
    targetCount: number,
  ) {
    return tx.badgeProgress.upsert({
      where: { userId_badgeType_weekKey: { userId, badgeType, weekKey } },
      create: { userId, badgeType, currentCount: 1, targetCount, weekKey },
      update: { currentCount: { increment: 1 } },
    })
  }

  createBadgeAward(tx: TxClient, userId: string, badgeType: BadgeType) {
    return tx.badgeAward.create({ data: { userId, badgeType } })
  }
}
