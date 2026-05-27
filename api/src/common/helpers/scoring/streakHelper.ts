import { startOfDay, differenceInCalendarDays } from 'date-fns'

interface StatsSnapshot {
  currentStreak: number
  longestStreak: number
  lastActivityDate: Date | null
}

interface StreakUpdate {
  currentStreak: number
  longestStreak: number
  lastActivityDate: Date
}

export function computeStreakUpdate(
  stats: StatsSnapshot | null,
  eventDate: Date,
): StreakUpdate | null {
  const today = startOfDay(eventDate)
  const last = stats?.lastActivityDate ? startOfDay(stats.lastActivityDate) : null

  if (last && differenceInCalendarDays(today, last) === 0) {
    return null
  }

  if (last && differenceInCalendarDays(today, last) === 1) {
    const next = (stats?.currentStreak ?? 0) + 1
    return {
      currentStreak: next,
      longestStreak: Math.max(stats?.longestStreak ?? 0, next),
      lastActivityDate: today,
    }
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(stats?.longestStreak ?? 0, 1),
    lastActivityDate: today,
  }
}
