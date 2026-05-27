import { ApiProperty } from '@nestjs/swagger'

export class UserStatsDto {
  @ApiProperty()
  totalXP!: number

  @ApiProperty()
  totalPoints!: number

  @ApiProperty()
  level!: number

  @ApiProperty()
  currentStreak!: number

  @ApiProperty()
  longestStreak!: number
}
