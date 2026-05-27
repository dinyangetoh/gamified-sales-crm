function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z" />
    </svg>
  )
}

export default function Streak({
  days,
  atRisk,
}: {
  days: number
  atRisk?: boolean
}) {
  if (!days) {
    return <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
  }

  const color = atRisk ? 'var(--warn)' : days >= 7 ? 'var(--flame)' : 'var(--ink-2)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color, fontSize: 12, fontWeight: 600 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <FlameIcon />
      </span>
      <span className="num">{days}</span>
    </span>
  )
}

