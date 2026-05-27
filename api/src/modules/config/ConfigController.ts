import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ConfigService } from './ConfigService'
import { EventTypeOptionDto } from './dto/EventTypeOptionDto'
import { LevelConfigDto } from './dto/LevelConfigDto'

@ApiTags('config')
@ApiBearerAuth()
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('levels')
  @ApiOperation({ summary: 'Get level configs sorted by minXP' })
  @ApiResponse({ status: 200, type: LevelConfigDto, isArray: true })
  async getLevels(): Promise<LevelConfigDto[]> {
    return this.configService.getLevelConfigs()
  }

  @Get('event-types')
  @ApiOperation({ summary: 'Event type options with UX display names' })
  @ApiResponse({ status: 200, type: EventTypeOptionDto, isArray: true })
  getEventTypes(): EventTypeOptionDto[] {
    return this.configService.getEventTypeOptions()
  }
}

