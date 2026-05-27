import { Body, Controller, ForbiddenException, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { ScoringService } from '../scoring/ScoringService'
import { CreateEventDto } from './dto/CreateEventDto'
import { ProcessEventResponseDto } from './dto/ProcessEventResponseDto'
import { CurrentUser } from '../../common/decorators/currentUser'
import type { JwtPayload } from '../auth/JwtStrategy'

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post()
  @ApiOperation({ summary: 'Ingest a CRM event and score it' })
  @ApiResponse({ status: 200, type: ProcessEventResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
