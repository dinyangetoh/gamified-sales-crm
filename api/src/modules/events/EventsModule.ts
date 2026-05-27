import { Module } from '@nestjs/common'
import { EventsController } from './EventsController'
import { ScoringModule } from '../scoring/ScoringModule'

@Module({
  imports: [ScoringModule],
  controllers: [EventsController],
})
export class EventsModule {}
