/** Illustrative chart series until manager analytics API exists. */

export const TEAM_WEEKS = ['W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21']
export const TEAM_POINTS_TS = [820, 940, 1080, 1020, 1180, 1220, 1280, 1440]
export const TEAM_EVENTS_TS = [82, 95, 110, 102, 118, 120, 122, 122]

export const TEAM_EVENT_MIX = [
  { label: 'LEAD_CONTACTED', value: 54, color: '#6c7280' },
  { label: 'MEETING_COMPLETED', value: 28, color: '#4a63b8' },
  { label: 'STAGE_ADVANCED', value: 24, color: '#7a4fbe' },
  { label: 'DEAL_WON', value: 12, color: '#3a8f63' },
  { label: 'DEAL_LOST', value: 4, color: '#b94a3b' },
]

export const LEVEL_DIST = [
  { label: 'Legend (L4)', value: 1, color: '#b88420' },
  { label: 'Elite (L3)', value: 3, color: '#7a4fbe' },
  { label: 'Closer (L2)', value: 3, color: '#4a63b8' },
  { label: 'Rookie (L1)', value: 1, color: '#6c7280' },
]

export const DOW_ACTIVITY = [28, 24, 26, 22, 18, 3, 1]

export const ACTIVITY_HEATMAP = [
  [6, 8, 4, 5, 3],
  [4, 7, 3, 5, 4],
  [5, 6, 5, 6, 3],
  [3, 6, 2, 7, 3],
  [2, 4, 3, 5, 3],
  [0, 1, 0, 1, 1],
  [0, 0, 1, 0, 0],
]

export const TOP_BY = {
  calls: [
    { id: 'george', v: 18 },
    { id: 'alice', v: 14 },
    { id: 'diana', v: 12 },
  ],
  meetings: [
    { id: 'diana', v: 9 },
    { id: 'alice', v: 8 },
    { id: 'bob', v: 6 },
  ],
  pipeline: [
    { id: 'bob', v: 7 },
    { id: 'alice', v: 5 },
    { id: 'fiona', v: 4 },
  ],
  wins: [
    { id: 'alice', v: 3 },
    { id: 'diana', v: 2 },
    { id: 'charlie', v: 1 },
  ],
} as const

export const DEMO_REPS_BY_ID: Record<string, { name: string; initials: string; tone: string }> = {
  alice: { name: 'Alice Smith', initials: 'AS', tone: 'lv-4' },
  diana: { name: 'Diana Osei', initials: 'DO', tone: 'lv-3' },
  bob: { name: 'Bob Tanaka', initials: 'BT', tone: 'lv-3' },
  charlie: { name: 'Charlie Reyes', initials: 'CR', tone: 'lv-2' },
  fiona: { name: 'Fiona Walsh', initials: 'FW', tone: 'lv-3' },
  george: { name: 'George Nakamura', initials: 'GN', tone: 'lv-2' },
}

export const KPI_TRENDS = {
  activeReps: [5, 6, 7, 6, 7, 7, 7, 7],
  events: TEAM_EVENTS_TS,
  points: TEAM_POINTS_TS,
  winRate: [55, 58, 60, 62, 65, 66, 68, 68],
  badges: [0, 1, 1, 0, 2, 1, 2, 3],
}
