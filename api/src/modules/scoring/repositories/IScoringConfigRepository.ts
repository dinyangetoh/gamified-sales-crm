import { ScoringConfig } from '../../../common/config/scoringConfig.schema'

export interface IScoringConfigRepository {
  getConfig(): Promise<ScoringConfig>
}
