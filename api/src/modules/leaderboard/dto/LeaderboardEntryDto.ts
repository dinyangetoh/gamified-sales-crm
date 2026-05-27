import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LeaderboardBadgeDto } from './LeaderboardBadgeDto'

export class LeaderboardEntryDto {
  @ApiProperty()
  rank!: number

  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiPropertyOptional()
  weekPoints!: number

  @ApiProperty()
  totalXP!: number

  @ApiProperty()
  level!: number

  @ApiProperty()
  levelLabel!: string

  @ApiProperty()
  currentStreak!: number

  @ApiProperty()
  pointsGap!: number

  @ApiPropertyOptional()
  totalPoints!: number

  @ApiProperty({ type: [LeaderboardBadgeDto] })
  badges!: LeaderboardBadgeDto[]
}
