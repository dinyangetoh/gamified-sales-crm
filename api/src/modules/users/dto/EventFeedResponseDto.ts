import { ApiProperty } from '@nestjs/swagger'
import { EventFeedItemDto } from './EventFeedItemDto'

export class EventFeedResponseDto {
  @ApiProperty({ type: [EventFeedItemDto] })
  events!: EventFeedItemDto[]

  @ApiProperty()
  total!: number

  @ApiProperty()
  limit!: number

  @ApiProperty()
  offset!: number
}
