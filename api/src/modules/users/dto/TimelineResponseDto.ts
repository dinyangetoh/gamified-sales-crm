import { ApiProperty } from '@nestjs/swagger'
import { TimelineEntryDto } from './TimelineEntryDto'

export class TimelineResponseDto {
  @ApiProperty({ type: [TimelineEntryDto] })
  timeline!: TimelineEntryDto[]

  @ApiProperty()
  total!: number

  @ApiProperty()
  limit!: number

  @ApiProperty()
  offset!: number
}
