import { loadAllDemoEvents, loadDemoManifest } from '../../../src/demo/loadDemoEvents'

describe('loadDemoEvents', () => {
  it('loads manifest with current week 2026-W22', () => {
    const manifest = loadDemoManifest()
    expect(manifest.anchorDate).toBe('2026-05-27')
    expect(manifest.currentIsoWeek).toBe('2026-W22')
    expect(manifest.weeks).toHaveLength(7)
  })

  it('loads 150+ validated demo events', () => {
    const events = loadAllDemoEvents()
    expect(events.length).toBeGreaterThanOrEqual(150)
    expect(events.every((e) => e.eventId.match(/^[0-9a-f-]{36}$/i))).toBe(true)
  })
})
