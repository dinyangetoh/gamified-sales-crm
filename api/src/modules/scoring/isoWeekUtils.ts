import { addDays, getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns'

export function getIsoWeek(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function currentIsoWeek(): string {
  return getIsoWeek(new Date())
}

function isoWeekToDateStart(isoWeek: string): Date {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)

  // ISO week 1 is the week containing Jan 4.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const week1Start = startOfISOWeek(jan4)
  return addDays(week1Start, (week - 1) * 7)
}

export function previousIsoWeek(isoWeek: string): string {
  const currentStart = isoWeekToDateStart(isoWeek)
  const prevStart = addDays(currentStart, -7)
  const week = getISOWeek(prevStart)
  const year = getISOWeekYear(prevStart)
  return `${year}-W${String(week).padStart(2, '0')}`
}
