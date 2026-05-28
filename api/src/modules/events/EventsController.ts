import { Body, Controller, ForbiddenException, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Role } from '@db'
import { ScoringService } from '../scoring/ScoringService'
import { CreateEventDto } from './dto/CreateEventDto'
import { ProcessEventResponseDto } from './dto/ProcessEventResponseDto'
import { CurrentUser } from '../../common/decorators/currentUser'
import type { JwtPayload } from '../auth/JwtStrategy'
import { ErrorResponseDto } from '../../common/dto/ErrorResponseDto'

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post()
  @ApiOperation({ summary: 'Ingest a CRM event and score it' })
  @ApiResponse({ status: 200, type: ProcessEventResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'User not found', type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async create(@Body() dto: CreateEventDto, @CurrentUser() actor: JwtPayload) {
    if (actor.role !== Role.MANAGER && actor.sub !== dto.userId) {
      throw new ForbiddenException('Sales reps may only submit events for themselves')
    }

    return this.scoringService.processEvent({
      eventId: dto.eventId,
      userId: dto.userId,
      eventType: dto.eventType,
      entityId: dto.entityId,
      timestamp: dto.timestamp,
      metadata: dto.metadata,
    })
  }
}
