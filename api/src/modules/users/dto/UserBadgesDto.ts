import { ApiProperty } from '@nestjs/swagger'
import { BadgeSummaryDto } from './BadgeSummaryDto'

export class UserBadgesDto {
  @ApiProperty({ type: [BadgeSummaryDto] })
  earned!: BadgeSummaryDto[]

  @ApiProperty({ type: [BadgeSummaryDto] })
  inProgress!: BadgeSummaryDto[]

  @ApiProperty({ type: [BadgeSummaryDto] })
  locked!: BadgeSummaryDto[]
}
