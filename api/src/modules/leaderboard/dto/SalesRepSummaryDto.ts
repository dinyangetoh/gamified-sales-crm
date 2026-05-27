import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SalesRepSummaryDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string

  @ApiProperty()
  totalXP!: number

  @ApiProperty()
  level!: number

  @ApiProperty()
  currentStreak!: number

  @ApiProperty()
  longestStreak!: number

  @ApiProperty()
  badgeCount!: number

  @ApiPropertyOptional()
  eventCount?: number

  @ApiPropertyOptional({ type: Date })
  lastActivityAt?: Date | null
}
