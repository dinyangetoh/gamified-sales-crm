interface LevelEntry {
  level: number
  minXP: number
  label: string
}

export function deriveLevel(xp: number, levels: LevelEntry[]): number {
  const sorted = [...levels].sort((a, b) => b.minXP - a.minXP)
  return sorted.find((l) => xp >= l.minXP)?.level ?? 1
}

export function deriveLevelLabel(xp: number, levels: LevelEntry[]): string {
  const sorted = [...levels].sort((a, b) => b.minXP - a.minXP)
  return sorted.find((l) => xp >= l.minXP)?.label ?? 'Rookie'
}
