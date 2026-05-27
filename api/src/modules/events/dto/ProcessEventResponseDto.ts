import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ProcessEventUserDto {
  @ApiProperty()
  totalXP!: number

  @ApiProperty()
  totalPoints!: number

  @ApiProperty()
  level!: number

  @ApiProperty()
  levelLabel!: string

  @ApiProperty()
  currentStreak!: number

  @ApiProperty()
  longestStreak!: number
}

export class ProcessEventBadgeDto {
  @ApiProperty()
  type!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  iconUrl!: string
}

export class ProcessEventResponseDto {
  @ApiProperty()
  eventId!: string

  @ApiProperty()
  accepted!: boolean

  @ApiProperty()
  duplicate!: boolean

  @ApiProperty()
  capReached!: boolean

  @ApiProperty()
  pointsAwarded!: number

  @ApiPropertyOptional()
  reason!: string

  @ApiPropertyOptional({ type: ProcessEventUserDto })
  user!: ProcessEventUserDto

  @ApiProperty({ type: [ProcessEventBadgeDto] })
  badgesUnlocked!: ProcessEventBadgeDto[]
}
