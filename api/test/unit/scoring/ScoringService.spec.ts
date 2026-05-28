import { mock, MockProxy } from 'jest-mock-extended'
import { EventType } from '@prisma/client'
import { ScoringService } from '../../../src/modules/scoring/ScoringService'
import { ScoringEventProcessor } from '../../../src/modules/scoring/ScoringEventProcessor'
import { CreateEventInput } from '../../../src/modules/scoring/ScoringModel'

describe('ScoringService', () => {
  let service: ScoringService
  let processor: MockProxy<ScoringEventProcessor>

  const baseInput: CreateEventInput = {
    eventId: 'evt-001',
    userId: 'user-1',
    eventType: EventType.DEAL_WON,
    entityId: 'deal-1',
    timestamp: new Date().toISOString(),
  }

  beforeEach(() => {
    processor = mock<ScoringEventProcessor>()
    service = new ScoringService(processor)
  })

  it('delegates processEvent to ScoringEventProcessor', async () => {
    const expected = {
      eventId: 'evt-001',
      accepted: true,
      duplicate: false,
      capReached: false,
      pointsAwarded: 100,
      badgesUnlocked: [],
    }
    processor.processEvent.mockResolvedValue(expected)

    const result = await service.processEvent(baseInput)

    expect(processor.processEvent).toHaveBeenCalledWith(baseInput)
    expect(result).toEqual(expected)
  })
})
