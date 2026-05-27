import { computeStreakUpdate } from '../../../../src/common/helpers/scoring/streakHelper'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

describe('computeStreakUpdate', () => {
  describe('null stats (first ever activity)', () => {
    it('returns streak of 1', () => {
      const result = computeStreakUpdate(null, daysAgo(0))
      expect(result).toEqual({
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: expect.any(Date),
      })
    })
  })

  describe('same-day event', () => {
    it('returns null when lastActivityDate is today', () => {
      const stats = { currentStreak: 3, longestStreak: 5, lastActivityDate: daysAgo(0) }
      expect(computeStreakUpdate(stats, daysAgo(0))).toBeNull()
    })
  })

  describe('consecutive day (yesterday)', () => {
    it('increments currentStreak', () => {
      const stats = { currentStreak: 4, longestStreak: 4, lastActivityDate: daysAgo(1) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.currentStreak).toBe(5)
    })

    it('updates longestStreak when new streak exceeds it', () => {
      const stats = { currentStreak: 4, longestStreak: 4, lastActivityDate: daysAgo(1) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.longestStreak).toBe(5)
    })

    it('preserves longestStreak when it already exceeds new streak', () => {
      const stats = { currentStreak: 3, longestStreak: 10, lastActivityDate: daysAgo(1) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.longestStreak).toBe(10)
    })

    it('sets lastActivityDate to today', () => {
      const stats = { currentStreak: 2, longestStreak: 2, lastActivityDate: daysAgo(1) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      const expected = new Date()
      expected.setHours(0, 0, 0, 0)
      expect(result?.lastActivityDate.toDateString()).toBe(expected.toDateString())
    })
  })

  describe('gap in activity', () => {
    it('resets streak to 1 after 2-day gap', () => {
      const stats = { currentStreak: 7, longestStreak: 7, lastActivityDate: daysAgo(2) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.currentStreak).toBe(1)
    })

    it('preserves longestStreak on reset', () => {
      const stats = { currentStreak: 7, longestStreak: 7, lastActivityDate: daysAgo(3) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.longestStreak).toBe(7)
    })

    it('resets streak to 1 after long gap', () => {
      const stats = { currentStreak: 14, longestStreak: 30, lastActivityDate: daysAgo(10) }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.currentStreak).toBe(1)
      expect(result?.longestStreak).toBe(30)
    })
  })

  describe('null lastActivityDate with existing stats', () => {
    it('starts streak at 1', () => {
      const stats = { currentStreak: 0, longestStreak: 0, lastActivityDate: null }
      const result = computeStreakUpdate(stats, daysAgo(0))
      expect(result?.currentStreak).toBe(1)
      expect(result?.longestStreak).toBe(1)
    })
  })

  describe('streak milestone values', () => {
    it('produces streak of 3 from 2-day streak yesterday', () => {
      const stats = { currentStreak: 2, longestStreak: 2, lastActivityDate: daysAgo(1) }
      expect(computeStreakUpdate(stats, daysAgo(0))?.currentStreak).toBe(3)
    })

    it('produces streak of 7 from 6-day streak yesterday', () => {
      const stats = { currentStreak: 6, longestStreak: 6, lastActivityDate: daysAgo(1) }
      expect(computeStreakUpdate(stats, daysAgo(0))?.currentStreak).toBe(7)
    })
  })
})
