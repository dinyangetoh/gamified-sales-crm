import { getISOWeek, getISOWeekYear } from 'date-fns'

export function getIsoWeek(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function currentIsoWeek(): string {
  return getIsoWeek(new Date())
}
