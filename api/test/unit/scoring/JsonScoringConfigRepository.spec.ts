import { JsonScoringConfigRepository } from '../../../src/modules/scoring/JsonScoringConfigRepository'

describe('JsonScoringConfigRepository', () => {
  it('returns the same config on repeated calls', async () => {
    const repo = new JsonScoringConfigRepository()
    const first = await repo.getConfig()
    const second = await repo.getConfig()
    expect(second).toBe(first)
    expect(first.pointRules.DEAL_WON).toBe(100)
  })
})
