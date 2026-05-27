import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LeaderboardBadgeDto } from '../../leaderboard/dto/LeaderboardBadgeDto'

export class AdminOverviewRepDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  rank!: number

  @ApiProperty()
  weekPoints!: number

  @ApiProperty()
  levelLabel!: string

  @ApiProperty()
  currentStreak!: number

  @ApiProperty({ type: [LeaderboardBadgeDto] })
  badges!: LeaderboardBadgeDto[]
}

export class AdminOverviewAtRiskItemDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiPropertyOptional()
  reason?: string
}

export class AdminOverviewResponseDto {
  @ApiProperty({ type: [AdminOverviewRepDto] })
  top3!: AdminOverviewRepDto[]

  @ApiProperty({ type: [AdminOverviewAtRiskItemDto] })
  atRisk!: AdminOverviewAtRiskItemDto[]

  @ApiPropertyOptional()
  kpis?: Record<string, unknown>
}
