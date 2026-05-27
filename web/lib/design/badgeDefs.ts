export type BadgeDef = {
  type: string
  name: string
  desc: string
  target: number
  window: string
  glyph: string
  tone: 'success' | 'flame' | 'lv-2' | 'lv-3' | 'lv-4'
}

export const BADGE_DEFS: BadgeDef[] = [
  { type: 'FIRST_WIN', name: 'First Win', desc: 'Close your first deal.', target: 1, window: 'lifetime', glyph: 'I', tone: 'success' },
  { type: 'CONSISTENT_CLOSER', name: 'Consistent Closer', desc: 'Close 3 deals in a single week.', target: 3, window: 'iso_week', glyph: 'III', tone: 'lv-3' },
  { type: 'PIPELINE_BUILDER', name: 'Pipeline Builder', desc: 'Advance 5 deals through stages in a week.', target: 5, window: 'iso_week', glyph: 'V', tone: 'lv-2' },
  { type: 'HOT_STREAK', name: 'Hot Streak', desc: 'Log activity 5 days in a row.', target: 5, window: 'lifetime', glyph: '★', tone: 'flame' },
  { type: 'TOP_OF_THE_WEEK', name: 'Top of the Week', desc: 'Finish #1 on the leaderboard at end of week.', target: 1, window: 'iso_week', glyph: '1', tone: 'lv-4' },
  { type: 'COMEBACK_KID', name: 'Comeback Kid', desc: 'Bounce back with a better week.', target: 1, window: 'iso_week', glyph: '↑', tone: 'lv-2' },
]

export function getBadgeDef(type: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.type === type)
}
