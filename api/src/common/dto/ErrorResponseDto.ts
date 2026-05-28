import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number

  @ApiProperty({ example: 'Bad Request' })
  error!: string

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] })
  message!: string | string[]

  @ApiProperty({ example: '/users/123' })
  path!: string

  @ApiProperty({ example: '2026-05-28T08:00:00.000Z' })
  timestamp!: string

  @ApiPropertyOptional({ example: 'req_abc123' })
  requestId?: string

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  details?: Record<string, unknown>
}
