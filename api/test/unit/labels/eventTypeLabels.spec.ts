import { EventType } from '@db'
import { getEventTypeDisplayName, listEventTypeOptions } from '../../../src/common/labels/eventTypeLabels'

describe('eventTypeLabels', () => {
  it('maps known event types to Title Case display names', () => {
    expect(getEventTypeDisplayName(EventType.LEAD_CONTACTED)).toBe('Lead Contacted')
    expect(getEventTypeDisplayName(EventType.DEAL_WON)).toBe('Deal Won')
  })

  it('lists all event type options with display names', () => {
    const options = listEventTypeOptions()
    expect(options).toHaveLength(5)
    expect(options.find((o) => o.value === EventType.STAGE_ADVANCED)?.displayName).toBe('Stage Advanced')
  })
})
