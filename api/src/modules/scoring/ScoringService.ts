import { Injectable } from '@nestjs/common'
import { ScoringEventProcessor } from './ScoringEventProcessor'
import { CreateEventInput, EventResult } from './ScoringModel'

export type { CreateEventInput, EventResult } from './ScoringModel'

@Injectable()
export class ScoringService {
  constructor(private readonly scoringEventProcessor: ScoringEventProcessor) {}

  processEvent(input: CreateEventInput): Promise<EventResult> {
    return this.scoringEventProcessor.processEvent(input)
  }
}
