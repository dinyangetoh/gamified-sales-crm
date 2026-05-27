import { ApiProperty } from '@nestjs/swagger'

export class LeaderboardBadgeDto {
  @ApiProperty()
  type!: string

  @ApiProperty()
  displayName!: string

  @ApiProperty()
  iconUrl!: string
}
