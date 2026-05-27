import { ApiProperty } from '@nestjs/swagger'

export class HealthIndicatorDto {
  @ApiProperty({ example: 'up' })
  status!: string
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string

  @ApiProperty({ type: 'object', additionalProperties: { type: 'object' } })
  info!: Record<string, HealthIndicatorDto>

  @ApiProperty({ type: 'object', additionalProperties: { type: 'object' } })
  error!: Record<string, HealthIndicatorDto>

  @ApiProperty({ type: 'object', additionalProperties: { type: 'object' } })
  details!: Record<string, HealthIndicatorDto>
}
