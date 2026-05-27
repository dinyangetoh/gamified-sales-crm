import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../common/decorators/roles'
import { ManagerOverviewService } from './ManagerOverviewService'
import { ManagerOverviewResponseDto } from './dto/ManagerOverviewResponseDto'

@ApiTags('manager')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager')
export class ManagerOverviewController {
  constructor(private readonly managerOverviewService: ManagerOverviewService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Manager aggregates: top performers, at-risk reps, DLQ counts' })
  @ApiQuery({ name: 'week', required: false, description: 'ISO week e.g. 2025-W21' })
  @ApiResponse({ status: 200, type: ManagerOverviewResponseDto })
  @ApiResponse({ status: 403 })
  async getOverview(@Query('week') week?: string): Promise<ManagerOverviewResponseDto> {
    return this.managerOverviewService.getOverview(week)
  }
}

