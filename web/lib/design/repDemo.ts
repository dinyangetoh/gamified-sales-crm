/** Demo series for rep dashboard charts where API has no time-series. */

export const MY_WEEK_PTS = [0, 65, 40, 85, 25, 100, 25]
export const MY_PREV_WEEK = [10, 30, 50, 40, 60, 60, 30]

export const MY_STREAK_DAYS = [
  { d: 'M', active: true },
  { d: 'T', active: true },
  { d: 'W', active: false },
  { d: 'T', active: true },
  { d: 'F', active: true },
  { d: 'S', active: false },
  { d: 'S', active: false },
  { d: 'M', active: true },
  { d: 'T', active: true },
  { d: 'W', active: true },
  { d: 'T', active: true },
  { d: 'F', active: true },
  { d: 'S', active: true },
  { d: 'S', active: true, today: true },
]

export const MY_EVENT_MIX = [
  { label: 'LEAD_CONTACTED', value: 7, color: '#6c7280' },
  { label: 'MEETING_COMPLETED', value: 3, color: '#4a63b8' },
  { label: 'STAGE_ADVANCED', value: 4, color: '#7a4fbe' },
  { label: 'DEAL_WON', value: 3, color: '#3a8f63' },
  { label: 'DEAL_LOST', value: 1, color: '#b94a3b' },
]

export const MY_RECORDS = {
  bestWeek: { value: 340, when: 'W21 · this week' },
  bestDay: { value: 140, when: 'May 23' },
  longestStreak: { value: 12, when: 'Apr 28 – May 9' },
  totalDeals: { value: 14, when: 'all time' },
  totalEvents: { value: 142, when: 'all time' },
  winRate: { value: 68, when: 'last 30 days' },
}
