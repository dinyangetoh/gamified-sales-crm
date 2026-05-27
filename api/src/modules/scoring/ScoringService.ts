import { Injectable } from '@nestjs/common'
import { ScoringEventProcessor } from './ScoringEventProcessor'
import { CreateEventInput, EventResult } from './types/eventResult.types'

export type { CreateEventInput, EventResult } from './types/eventResult.types'

@Injectable()
export class ScoringService {
  constructor(private readonly scoringEventProcessor: ScoringEventProcessor) {}

  processEvent(input: CreateEventInput): Promise<EventResult> {
    return this.scoringEventProcessor.processEvent(input)
  }
}
