import { Injectable } from '@nestjs/common'
import { loadScoringConfig } from '../../../common/config/loadScoringConfig'
import { ScoringConfig } from '../../../common/config/scoringConfig.schema'
import { IScoringConfigRepository } from './IScoringConfigRepository'

@Injectable()
export class JsonScoringConfigRepository implements IScoringConfigRepository {
  private cached: ScoringConfig | null = null

  async getConfig(): Promise<ScoringConfig> {
    if (!this.cached) {
      this.cached = loadScoringConfig()
    }
    return this.cached
  }
}
