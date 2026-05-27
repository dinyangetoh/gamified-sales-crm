import { ApiProperty } from '@nestjs/swagger'

export class EventFeedItemDto {
  @ApiProperty()
  eventId!: string

  @ApiProperty()
  userId!: string

  @ApiProperty()
  provider!: string

  @ApiProperty()
  eventType!: string

  @ApiProperty()
  eventTypeDisplayName!: string

  @ApiProperty()
  entityId!: string

  @ApiProperty()
  pointsAwarded!: number

  @ApiProperty()
  capReached!: boolean

  @ApiProperty()
  timestamp!: Date

  @ApiProperty()
  createdAt!: Date
}
