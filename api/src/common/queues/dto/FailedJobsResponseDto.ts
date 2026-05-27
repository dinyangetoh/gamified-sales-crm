import { ApiProperty } from '@nestjs/swagger'
import { FailedJobDto } from './FailedJobDto'

export class FailedJobsResponseDto {
  @ApiProperty({ type: [FailedJobDto] })
  jobs!: FailedJobDto[]
}
