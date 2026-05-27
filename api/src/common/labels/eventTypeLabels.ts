import { EventType } from '@db'

export type EventTypeLabel = {
  displayName: string
  shortName: string
}

const EVENT_TYPE_LABELS: Record<EventType, EventTypeLabel> = {
  [EventType.LEAD_CONTACTED]: { displayName: 'Lead Contacted', shortName: 'Lead Contacted' },
  [EventType.MEETING_COMPLETED]: { displayName: 'Meeting Completed', shortName: 'Meeting Completed' },
  [EventType.STAGE_ADVANCED]: { displayName: 'Stage Advanced', shortName: 'Stage Advanced' },
  [EventType.DEAL_WON]: { displayName: 'Deal Won', shortName: 'Deal Won' },
  [EventType.DEAL_LOST]: { displayName: 'Deal Lost', shortName: 'Deal Lost' },
}

export function getEventTypeLabel(eventType: EventType | string): EventTypeLabel {
  const key = eventType as EventType
  return EVENT_TYPE_LABELS[key] ?? { displayName: String(eventType), shortName: String(eventType) }
}

export function getEventTypeDisplayName(eventType: EventType | string): string {
  return getEventTypeLabel(eventType).displayName
}

export function listEventTypeOptions(): Array<{ value: EventType; displayName: string; shortName: string }> {
  return (Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((value) => {
    const { displayName, shortName } = EVENT_TYPE_LABELS[value]
    return { value, displayName, shortName }
  })
}
