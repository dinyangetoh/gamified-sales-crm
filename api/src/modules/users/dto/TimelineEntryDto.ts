import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TimelineEntryDto {
  @ApiProperty()
  id!: string

  @ApiProperty()
  type!: string

  @ApiPropertyOptional()
  badgeType!: string | null

  @ApiPropertyOptional()
  displayName!: string

  @ApiPropertyOptional()
  iconUrl!: string

  @ApiProperty()
  pointsSnapshot!: number

  @ApiProperty()
  xpSnapshot!: number

  @ApiProperty()
  levelSnapshot!: number

  @ApiPropertyOptional()
  weekKey!: string | null

  @ApiPropertyOptional()
  metadata!: object | null

  @ApiProperty()
  createdAt!: Date
}
