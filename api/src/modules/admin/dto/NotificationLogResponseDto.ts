import { ApiProperty } from '@nestjs/swagger'
import { NotificationLogItemDto } from './NotificationLogItemDto'

export class NotificationLogResponseDto {
  @ApiProperty({ type: [NotificationLogItemDto] })
  items!: NotificationLogItemDto[]

  @ApiProperty()
  total!: number

  @ApiProperty()
  limit!: number

  @ApiProperty()
  offset!: number
}

