import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class NotificationLogUserDto {
  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string
}

export class NotificationLogItemDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  userId!: string

  @ApiProperty()
  type!: string

  @ApiProperty()
  sentAt!: Date

  @ApiPropertyOptional({ type: Object })
  metadata?: Record<string, unknown>

  @ApiPropertyOptional({ type: NotificationLogUserDto })
  user?: NotificationLogUserDto
}

