import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LeaderboardBadgeDto } from '../../leaderboard/dto/LeaderboardBadgeDto'

export class ManagerOverviewRepDto {
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

export class ManagerOverviewAtRiskItemDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiPropertyOptional()
  reason?: string
}

export class ManagerOverviewResponseDto {
  @ApiProperty({ type: [ManagerOverviewRepDto] })
  top3!: ManagerOverviewRepDto[]

  @ApiProperty({ type: [ManagerOverviewAtRiskItemDto] })
  atRisk!: ManagerOverviewAtRiskItemDto[]

  @ApiPropertyOptional()
  kpis?: Record<string, unknown>

  @ApiPropertyOptional()
  dlq?: Record<string, unknown>
}

