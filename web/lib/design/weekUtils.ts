export function recentIsoWeeks(count = 8): string[] {
  const now = new Date()
  const weeks: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    const year = d.getFullYear()
    const jan1 = new Date(year, 0, 1)
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000)
    const week = Math.ceil((days + jan1.getDay() + 1) / 7)
    weeks.push(`${year}-W${String(week).padStart(2, '0')}`)
  }
  return [...new Set(weeks)]
}

export function formatWeekLabel(isoWeek: string): string {
  const m = isoWeek.match(/W(\d+)/)
  return m ? `W${m[1]}` : isoWeek
}
