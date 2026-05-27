import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../common/decorators/roles'
import { ManagerService } from './ManagerService'
import { ManagerRulesResponseDto } from './dto/ManagerRulesResponseDto'
import { SalesRepSummaryDto } from './dto/SalesRepSummaryDto'

@ApiTags('manager')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('rules')
  @ApiOperation({ summary: 'View current scoring rules, caps, levels and badge definitions' })
  @ApiResponse({ status: 200, type: ManagerRulesResponseDto })
  @ApiResponse({ status: 403 })
  async getRules() {
    return this.managerService.getRules()
  }

  @Get('reps')
  @ApiOperation({ summary: 'List all sales rep summaries' })
  @ApiResponse({ status: 200, type: SalesRepSummaryDto, isArray: true })
  async getReps() {
    return this.managerService.getReps()
  }
}
