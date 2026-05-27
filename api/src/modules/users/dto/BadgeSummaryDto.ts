import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class BadgeSummaryDto {
  @ApiProperty()
  type!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  description!: string

  @ApiProperty()
  iconUrl!: string

  @ApiPropertyOptional()
  awardedAt!: Date

  @ApiPropertyOptional()
  currentCount!: number

  @ApiPropertyOptional()
  targetCount!: number

  @ApiPropertyOptional()
  progressPercent!: number

  @ApiPropertyOptional()
  weekKey!: string | null

  @ApiPropertyOptional()
  locked!: boolean
}
