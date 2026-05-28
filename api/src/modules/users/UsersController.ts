import {
  Controller,
  Get,
  Param,
  Query,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Role } from '@db'
import { UsersService } from './UsersService'
import { CurrentUser } from '../../common/decorators/currentUser'
import type { JwtPayload } from '../auth/JwtStrategy'
import { UserProfileResponseDto } from './dto/UserProfileResponseDto'
import { TimelineResponseDto } from './dto/TimelineResponseDto'
import { EventFeedResponseDto } from './dto/EventFeedResponseDto'
import { ErrorResponseDto } from '../../common/dto/ErrorResponseDto'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user gamification profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async getProfile(@Param('userId') userId: string, @CurrentUser() actor: JwtPayload) {
    if (actor.role !== Role.MANAGER && actor.sub !== userId) {
      throw new ForbiddenException()
    }
    return this.usersService.getProfile(userId)
  }

  @Get(':userId/timeline')
  @ApiOperation({ summary: 'Get award timeline for a user' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, type: TimelineResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async getTimeline(
    @Param('userId') userId: string,
    @CurrentUser() actor: JwtPayload,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    if (actor.role !== Role.MANAGER && actor.sub !== userId) {
      throw new ForbiddenException()
    }
    return this.usersService.getTimeline(userId, limit, offset)
  }

  @Get(':userId/events')
  @ApiOperation({ summary: 'Get event audit log for a user' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({ status: 200, type: EventFeedResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  async getEvents(
    @Param('userId') userId: string,
    @CurrentUser() actor: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    if (actor.role !== Role.MANAGER && actor.sub !== userId) {
      throw new ForbiddenException()
    }
    return this.usersService.getEventFeed(userId, { from, to, limit, offset })
  }
}
