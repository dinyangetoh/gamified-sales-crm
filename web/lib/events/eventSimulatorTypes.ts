export const SIMULATOR_EVENT_TYPES = [
  { value: 'LEAD_CONTACTED', label: 'Lead Contacted' },
  { value: 'MEETING_COMPLETED', label: 'Meeting Completed' },
  { value: 'STAGE_ADVANCED', label: 'Stage Advanced' },
  { value: 'DEAL_WON', label: 'Deal Won' },
  { value: 'DEAL_LOST', label: 'Deal Lost' },
] as const

export type SimulatorEventType = (typeof SIMULATOR_EVENT_TYPES)[number]['value']

export type ProcessEventResult = {
  eventId: string
  accepted: boolean
  duplicate: boolean
  capReached: boolean
  pointsAwarded: number
  reason?: string
  user?: {
    totalXP: number
    totalPoints: number
    level: number
    levelLabel: string
    currentStreak: number
    longestStreak: number
  }
  badgesUnlocked: Array<{ type: string; displayName: string; iconUrl: string }>
}

export type SimulatorErrorResult = {
  kind: 'error'
  message: string
}

export type SimulatorModalState =
  | { kind: 'success'; result: ProcessEventResult }
  | SimulatorErrorResult

export function newEventId() {
  return crypto.randomUUID()
}
