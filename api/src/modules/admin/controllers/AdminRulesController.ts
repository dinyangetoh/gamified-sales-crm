import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Role } from '@db'
import { Roles } from '../../../common/decorators/roles'
import { ConfigService } from '../../config/ConfigService'
import { AdminRulesResponseDto } from '../dto/AdminRulesResponseDto'

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('admin')
export class AdminRulesController {
  constructor(private readonly configService: ConfigService) {}

  @Get('rules')
  @ApiOperation({ summary: 'View current scoring rules, caps, levels and badge definitions' })
  @ApiResponse({ status: 200, type: AdminRulesResponseDto })
  @ApiResponse({ status: 403 })
  async getRules() {
    return this.configService.getGamificationRules()
  }
}
