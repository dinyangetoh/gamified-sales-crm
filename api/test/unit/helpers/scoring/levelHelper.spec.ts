import { deriveLevel, deriveLevelLabel } from '../../../../src/common/helpers/scoring/levelHelper'

const LEVELS = [
  { level: 1, minXP: 0, label: 'Rookie' },
  { level: 2, minXP: 100, label: 'Closer' },
  { level: 3, minXP: 250, label: 'Elite' },
  { level: 4, minXP: 500, label: 'Legend' },
]

describe('deriveLevel', () => {
  it('returns level 1 at 0 XP', () => {
    expect(deriveLevel(0, LEVELS)).toBe(1)
  })

  it('returns level 1 at 99 XP', () => {
    expect(deriveLevel(99, LEVELS)).toBe(1)
  })

  it('returns level 2 at exactly 100 XP', () => {
    expect(deriveLevel(100, LEVELS)).toBe(2)
  })

  it('returns level 2 at 249 XP', () => {
    expect(deriveLevel(249, LEVELS)).toBe(2)
  })

  it('returns level 3 at exactly 250 XP', () => {
    expect(deriveLevel(250, LEVELS)).toBe(3)
  })

  it('returns level 3 at 499 XP', () => {
    expect(deriveLevel(499, LEVELS)).toBe(3)
  })

  it('returns level 4 at exactly 500 XP', () => {
    expect(deriveLevel(500, LEVELS)).toBe(4)
  })

  it('returns level 4 at very high XP', () => {
    expect(deriveLevel(99999, LEVELS)).toBe(4)
  })

  it('returns 1 when levels array is empty', () => {
    expect(deriveLevel(500, [])).toBe(1)
  })

  it('is not sensitive to input order of levels array', () => {
    const reversed = [...LEVELS].reverse()
    expect(deriveLevel(250, reversed)).toBe(3)
  })
})

describe('deriveLevelLabel', () => {
  it('returns Rookie at 0 XP', () => {
    expect(deriveLevelLabel(0, LEVELS)).toBe('Rookie')
  })

  it('returns Closer at 100 XP', () => {
    expect(deriveLevelLabel(100, LEVELS)).toBe('Closer')
  })

  it('returns Elite at 250 XP', () => {
    expect(deriveLevelLabel(250, LEVELS)).toBe('Elite')
  })

  it('returns Legend at 500 XP', () => {
    expect(deriveLevelLabel(500, LEVELS)).toBe('Legend')
  })

  it('falls back to Rookie for empty levels', () => {
    expect(deriveLevelLabel(500, [])).toBe('Rookie')
  })
})
