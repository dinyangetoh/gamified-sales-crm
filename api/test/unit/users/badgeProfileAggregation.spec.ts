import { BadgeType } from '@prisma/client'
import {
  aggregateEarnedBadges,
  aggregateInProgressBadges,
} from '../../../src/modules/users/badgeProfileAggregation'

describe('badgeProfileAggregation', () => {
  it('aggregates earned badges by type with awardCount', () => {
    const earned = aggregateEarnedBadges([
      { badgeType: BadgeType.HOT_STREAK, awardedAt: new Date('2025-05-01') },
      { badgeType: BadgeType.HOT_STREAK, awardedAt: new Date('2025-05-20') },
      { badgeType: BadgeType.FIRST_WIN, awardedAt: new Date('2025-05-10') },
    ])

    expect(earned).toHaveLength(2)
    const hot = earned.find((b) => b.type === BadgeType.HOT_STREAK)!
    expect(hot.awardCount).toBe(2)
    expect(hot.latestAwardedAt).toEqual(new Date('2025-05-20'))
  })

  it('deduplicates in-progress rows by badge type', () => {
    const inProgress = aggregateInProgressBadges(
      [
        {
          badgeType: BadgeType.PIPELINE_BUILDER,
          currentCount: 1,
          targetCount: 5,
          weekKey: '2025-W19',
          updatedAt: new Date('2025-05-01'),
        },
        {
          badgeType: BadgeType.PIPELINE_BUILDER,
          currentCount: 2,
          targetCount: 5,
          weekKey: '2025-W20',
          updatedAt: new Date('2025-05-10'),
        },
      ],
      '2025-W20',
      new Set(),
    )

    expect(inProgress).toHaveLength(1)
    expect(inProgress[0].currentCount).toBe(2)
    expect(inProgress[0].weekKey).toBe('2025-W20')
  })
})
