import {
  Controller,
  Get,
  Param,
  Query,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { UsersService } from './UsersService'
import { CurrentUser } from '../../common/decorators/currentUser'
import { Roles } from '../../common/decorators/roles'
import type { JwtPayload } from '../auth/JwtStrategy'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user gamification profile' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
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
