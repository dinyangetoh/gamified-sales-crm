import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../../common/decorators/roles'
import { AdminOverviewService } from '../AdminOverviewService'
import { AdminOverviewResponseDto } from '../dto/AdminOverviewResponseDto'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminOverviewController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Admin aggregates: top performers, at-risk reps, DLQ counts' })
  @ApiQuery({ name: 'week', required: false, description: 'ISO week e.g. 2025-W21' })
  @ApiResponse({ status: 200, type: AdminOverviewResponseDto })
  @ApiResponse({ status: 403 })
  async getOverview(@Query('week') week?: string): Promise<AdminOverviewResponseDto> {
    return this.adminOverviewService.getOverview(week)
  }
}
