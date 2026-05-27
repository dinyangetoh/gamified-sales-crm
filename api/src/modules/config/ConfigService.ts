import { Injectable } from '@nestjs/common'
import { listEventTypeOptions } from '../../common/labels/eventTypeLabels'
import { ScoringConfigService } from '../scoring/ScoringConfigService'
import { EventTypeOptionDto } from './dto/EventTypeOptionDto'
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

  getEventTypeOptions(): EventTypeOptionDto[] {
    return listEventTypeOptions().map((o) => ({
      value: o.value,
      displayName: o.displayName,
      shortName: o.shortName,
    }))
  }
}
