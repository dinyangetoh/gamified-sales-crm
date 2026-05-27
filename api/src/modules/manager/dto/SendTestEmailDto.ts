import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator'

export class SendTestEmailDto {
  @ApiProperty({ description: 'Where to send the test email' })
  @IsEmail()
  toEmail!: string

  @ApiPropertyOptional({ description: 'Optional target userId for personalization and notification-log ownership' })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiPropertyOptional({ description: 'Optional week key for weekly templates (ISO week e.g. 2025-W21)' })
  @IsOptional()
  @IsString()
  week?: string
}

export class SendTestEmailResponseDto {
  @ApiProperty({ description: 'Whether the test send was accepted for processing' })
  accepted!: boolean
}

