import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { LeaderboardEntryDto } from './LeaderboardEntryDto'

export class LeaderboardResponseDto {
  @ApiPropertyOptional({ example: '2025-W21' })
  week!: string

  @ApiProperty()
  generatedAt!: Date

  @ApiProperty()
  fromCache!: boolean

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries!: LeaderboardEntryDto[]
}
