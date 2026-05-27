import { ApiProperty } from '@nestjs/swagger'

export class FailedJobDto {
  @ApiProperty()
  jobId!: string

  @ApiProperty()
  queue!: string

  @ApiProperty()
  name!: string

  @ApiProperty()
  data!: object

  @ApiProperty()
  failedReason!: string

  @ApiProperty()
  attemptsMade!: number

  @ApiProperty()
  timestamp!: number
}
