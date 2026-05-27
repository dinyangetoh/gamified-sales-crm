import { join } from 'path'
import { loadScoringConfig } from '../../../src/common/config/loadScoringConfig'

const CONFIG_PATH = join(__dirname, '../../../src/common/config/scoring-config.json')

describe('loadScoringConfig', () => {
  it('loads point rules matching the assessment spec', () => {
    const config = loadScoringConfig(CONFIG_PATH)
    expect(config.pointRules).toEqual({
      LEAD_CONTACTED: 10,
      MEETING_COMPLETED: 20,
      STAGE_ADVANCED: 30,
      DEAL_WON: 100,
      DEAL_LOST: -20,
    })
  })

  it('loads daily cap for LEAD_CONTACTED only', () => {
    const config = loadScoringConfig(CONFIG_PATH)
    expect(config.dailyCaps.LEAD_CONTACTED).toEqual({ maxCount: 5, isActive: true })
  })

  it('loads level thresholds', () => {
    const config = loadScoringConfig(CONFIG_PATH)
    expect(config.levels).toEqual([
      { level: 1, minXP: 0, label: 'Rookie' },
      { level: 2, minXP: 100, label: 'Closer' },
      { level: 3, minXP: 250, label: 'Elite' },
      { level: 4, minXP: 500, label: 'Legend' },
    ])
  })
})
