import { ApiProperty } from '@nestjs/swagger'

export class WebhookAcceptedDto {
  @ApiProperty({ example: 3 })
  queued!: number
}
