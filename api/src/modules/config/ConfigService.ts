import { Injectable } from '@nestjs/common'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { LevelConfigDto } from './dto/LevelConfigDto'

@Injectable()
export class ConfigService {
  constructor(private readonly scoringConfigService: ScoringConfigService) {}

  async getLevelConfigs(): Promise<LevelConfigDto[]> {
    const { levels } = await this.scoringConfigService.getConfig()
    return levels.map((c) => ({
      level: c.level,
      minXP: c.minXP,
      label: c.label,
    }))
  }
}
