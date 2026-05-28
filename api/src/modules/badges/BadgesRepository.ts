import { Injectable } from '@nestjs/common'
import { BadgeType } from '@db'
import { startOfDay, subDays } from 'date-fns'
import type { TxClient } from '../../common/prisma/types'
import type {
  BadgeAwardRow,
  BadgeAwardRows,
  BadgeProgressCreateInput,
  BadgeProgressRow,
  BadgeProgressRowOrNull,
  BadgeProgressUpdateInput,
} from './BadgesModel'

@Injectable()
export class BadgesRepository {
  findBadgeAwards(tx: TxClient, userId: string): Promise<BadgeAwardRows> {
    return tx.badgeAward.findMany({ where: { userId }, orderBy: { awardedAt: 'asc' } })
  }

  findBadgeProgress(
    tx: TxClient,
    userId: string,
    badgeType: BadgeType,
    weekKey: string | null,
  ): Promise<BadgeProgressRowOrNull> {
    return tx.badgeProgress.findFirst({
      where: { userId, badgeType, weekKey },
    })
  }

  hasBadgeAward(tx: TxClient, userId: string, badgeType: BadgeType): Promise<boolean> {
    return tx.badgeAward
      .findFirst({ where: { userId, badgeType }, select: { id: true } })
      .then((row) => row !== null)
  }

  hasBadgeAwardForWeek(
    tx: TxClient,
    userId: string,
    badgeType: BadgeType,
    weekKey: string,
  ): Promise<boolean> {
    return tx.badgeAward
      .findFirst({ where: { userId, badgeType, weekKey }, select: { id: true } })
      .then((row) => row !== null)
  }

  hasHotStreakAwardInCurrentStreak(
    tx: TxClient,
    userId: string,
    currentStreak: number,
    asOf: Date,
  ): Promise<boolean> {
    if (currentStreak < 1) return Promise.resolve(false)
    const streakStart = startOfDay(subDays(asOf, currentStreak - 1))
    return tx.badgeAward
      .findFirst({
        where: {
          userId,
          badgeType: BadgeType.HOT_STREAK,
          awardedAt: { gte: streakStart },
        },
        select: { id: true },
      })
      .then((row) => row !== null)
  }

  updateBadgeProgress(tx: TxClient, id: string, data: BadgeProgressUpdateInput): Promise<BadgeProgressRow> {
    return tx.badgeProgress.update({ where: { id }, data })
  }

  createBadgeProgress(tx: TxClient, data: BadgeProgressCreateInput): Promise<BadgeProgressRow> {
    return tx.badgeProgress.create({ data })
  }

  upsertBadgeProgress(
    tx: TxClient,
    userId: string,
    badgeType: BadgeType,
    weekKey: string,
    targetCount: number,
  ): Promise<BadgeProgressRow> {
    return tx.badgeProgress.upsert({
      where: { userId_badgeType_weekKey: { userId, badgeType, weekKey } },
      create: { userId, badgeType, currentCount: 1, targetCount, weekKey },
      update: { currentCount: { increment: 1 } },
    })
  }

  createBadgeAward(
    tx: TxClient,
    userId: string,
    badgeType: BadgeType,
    weekKey: string | null = null,
    awardedAt?: Date,
  ): Promise<BadgeAwardRow> {
    return tx.badgeAward.create({
      data: {
        userId,
        badgeType,
        weekKey,
        ...(awardedAt ? { awardedAt } : {}),
      },
    })
  }
}
