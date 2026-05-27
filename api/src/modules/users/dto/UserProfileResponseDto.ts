import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserBadgesDto } from './UserBadgesDto'
import { UserStatsDto } from './UserStatsDto'

export class UserProfileResponseDto {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  email!: string

  @ApiProperty()
  role!: string

  @ApiPropertyOptional({ type: UserStatsDto })
  stats!: UserStatsDto | null

  @ApiProperty({ type: UserBadgesDto })
  badges!: UserBadgesDto
}
