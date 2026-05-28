import { Controller, Get, Query } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { LeaderboardService } from './LeaderboardService'
import { LeaderboardResponseDto } from './dto/LeaderboardResponseDto'
import { ErrorResponseDto } from '../../common/dto/ErrorResponseDto'

@ApiTags('leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Weekly leaderboard ranked by weekPoints' })
  @ApiQuery({
    name: 'week',
    required: false,
    description: 'ISO week e.g. 2025-W21 (defaults to current week)',
  })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  getWeekly(@Query('week') week?: string) {
    return this.leaderboardService.getWeeklyLeaderboard(week)
  }

  @Get('all-time')
  @ApiOperation({ summary: 'All-time leaderboard ranked by totalXP' })
  @ApiResponse({ status: 200, type: LeaderboardResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiInternalServerErrorResponse({ type: ErrorResponseDto })
  getAllTime() {
    return this.leaderboardService.getAllTimeLeaderboard()
  }
}
