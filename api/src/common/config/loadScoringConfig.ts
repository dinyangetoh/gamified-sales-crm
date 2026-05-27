import { readFileSync } from 'fs'
import { join } from 'path'
import { scoringConfigSchema, ScoringConfig } from './scoringConfig.schema'

const DEFAULT_CONFIG_PATH = join(__dirname, 'scoring-config.json')

export function loadScoringConfig(configPath = DEFAULT_CONFIG_PATH): ScoringConfig {
  const raw = readFileSync(configPath, 'utf-8')
  return scoringConfigSchema.parse(JSON.parse(raw))
}
