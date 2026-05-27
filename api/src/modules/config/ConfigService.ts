import { Injectable } from '@nestjs/common'
import { ScoringRepository } from '../scoring/ScoringRepository'
import { LevelConfigDto } from './dto/LevelConfigDto'

@Injectable()
export class ConfigService {
  constructor(private readonly scoringRepo: ScoringRepository) {}

  async getLevelConfigs(): Promise<LevelConfigDto[]> {
    const configs = await this.scoringRepo.findLevelConfigs()
    return configs.map((c: any) => ({
      level: c.level,
      minXP: c.minXP,
      label: c.label,
    }))
  }
}

