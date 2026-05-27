import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../../common/decorators/roles'
import { SalesRepSummaryDto } from '../../leaderboard/dto/SalesRepSummaryDto'
import { UsersService } from '../../users/UsersService'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminRepsController {
  constructor(private readonly usersService: UsersService) {}

  @Get('reps')
  @ApiOperation({ summary: 'List all sales rep summaries' })
  @ApiResponse({ status: 200, type: SalesRepSummaryDto, isArray: true })
  async getReps() {
    return this.usersService.listSalesRepSummaries()
  }
}
