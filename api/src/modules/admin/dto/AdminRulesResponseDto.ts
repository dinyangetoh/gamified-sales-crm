import { ApiProperty } from '@nestjs/swagger'
import { BadgeWindowType } from '../../badges/badgeDefinitions'

export class ScoringRuleDto {
  @ApiProperty()
  eventType!: string

  @ApiProperty()
  eventTypeDisplayName!: string

  @ApiProperty()
  points!: number

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  updatedAt!: Date
}

export class DailyCapRuleDto {
  @ApiProperty()
  eventType!: string

  @ApiProperty()
  eventTypeDisplayName!: string

  @ApiProperty()
  maxCount!: number

  @ApiProperty()
  isActive!: boolean

  @ApiProperty()
  updatedAt!: Date
}

export class AdminLevelConfigDto {
  @ApiProperty()
  level!: number

  @ApiProperty()
  minXP!: number

  @ApiProperty()
  label!: string
}

export class BadgeDefinitionDto {
  @ApiProperty()
  type!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  description!: string

  @ApiProperty()
  iconUrl!: string

  @ApiProperty()
  targetCount!: number

  @ApiProperty({ enum: BadgeWindowType, enumName: 'BadgeWindowType' })
  windowType!: BadgeWindowType
}

export class AdminRulesResponseDto {
  @ApiProperty({ type: [ScoringRuleDto] })
  scoringRules!: ScoringRuleDto[]

  @ApiProperty({ type: [DailyCapRuleDto] })
  dailyCapRules!: DailyCapRuleDto[]

  @ApiProperty({ type: [AdminLevelConfigDto] })
  levelConfig!: AdminLevelConfigDto[]

  @ApiProperty({ type: [BadgeDefinitionDto] })
  badges!: BadgeDefinitionDto[]
}
