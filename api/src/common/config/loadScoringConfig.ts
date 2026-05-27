import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { scoringConfigSchema, ScoringConfig } from './scoringConfig.schema'

function resolveDefaultConfigPath(): string {
  const candidates = [
    join(__dirname, 'scoring-config.json'),
    join(__dirname, '../../../common/config/scoring-config.json'),
    join(process.cwd(), 'src/common/config/scoring-config.json'),
    join(process.cwd(), 'dist/common/config/scoring-config.json'),
  ]

  const found = candidates.find((p) => existsSync(p))
  if (!found) {
    throw new Error(`scoring-config.json not found. Checked: ${candidates.join(', ')}`)
  }
  return found
}

export function loadScoringConfig(configPath = resolveDefaultConfigPath()): ScoringConfig {
  const raw = readFileSync(configPath, 'utf-8')
  return scoringConfigSchema.parse(JSON.parse(raw))
}
