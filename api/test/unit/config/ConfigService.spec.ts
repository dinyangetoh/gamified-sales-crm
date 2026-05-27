import { ConfigService } from '../../../src/modules/config/ConfigService'

describe('ConfigService', () => {
  const scoringConfigService = {
    getConfig: jest.fn(),
  } as unknown as import('../../../src/modules/scoring/ScoringConfigService').ScoringConfigService

  const service = new ConfigService(scoringConfigService)

  it('returns event type options with display names', () => {
    const options = service.getEventTypeOptions()
    expect(options.length).toBeGreaterThan(0)
    expect(options[0]).toMatchObject({
      value: expect.any(String),
      displayName: expect.any(String),
      shortName: expect.any(String),
    })
    expect(options.find((o) => o.value === 'DEAL_WON')?.displayName).toBe('Deal Won')
  })
})
