import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { EventType } from '@db'
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'

export class CreateEventDto {
  @ApiProperty({ description: 'Unique CRM event ID (used for idempotency)', example: 'evt-001' })
  @IsString()
  eventId!: string

  @ApiProperty({ description: 'User UUID', example: 'uuid-alice' })
  @IsUUID()
  userId!: string

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  eventType!: EventType

  @ApiProperty({ description: 'Lead or opportunity ID', example: 'deal-123' })
  @IsString()
  entityId!: string

  @ApiProperty({ description: 'ISO 8601 timestamp', example: '2025-05-22T10:00:00Z' })
  @IsDateString()
  timestamp!: string

  @ApiPropertyOptional({ description: 'Optional metadata object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>
}
