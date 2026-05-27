import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RetryJobResponseDto {
  @ApiProperty()
  retried!: boolean

  @ApiProperty()
  jobId!: string

  @ApiPropertyOptional()
  queue!: string

  @ApiPropertyOptional()
  reason!: string
}
