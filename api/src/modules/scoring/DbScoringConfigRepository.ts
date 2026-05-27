import { Injectable } from '@nestjs/common'
import { ScoringConfig } from '../../common/config/scoringConfig.schema'
import { ScoringRepository } from './ScoringRepository'
import { IScoringConfigRepository } from './IScoringConfigRepository'

@Injectable()
export class DbScoringConfigRepository implements IScoringConfigRepository {
  constructor(private readonly scoringRepo: ScoringRepository) {}

  async getConfig(): Promise<ScoringConfig> {
    const [scoringRules, levelConfigs, capConfigs] = await Promise.all([
      this.scoringRepo.findScoringRules(),
      this.scoringRepo.findLevelConfigs(),
      this.scoringRepo.findDailyCapConfigs(),
    ])

    return {
      pointRules: Object.fromEntries(scoringRules.map((r) => [r.eventType, r.points])),
      dailyCaps: Object.fromEntries(
        capConfigs.map((c) => [c.eventType, { maxCount: c.maxCount, isActive: c.isActive }]),
      ),
      levels: levelConfigs.map((l) => ({ level: l.level, minXP: l.minXP, label: l.label })),
    }
  }
}
