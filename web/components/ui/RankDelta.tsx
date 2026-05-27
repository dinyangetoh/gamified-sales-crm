export default function RankDelta({ delta }: { delta: number | null | undefined }) {
  if (!delta && delta !== 0) return <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>—</span>
  if (delta === 0) return <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>

  const up = delta > 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: up ? 'var(--success)' : 'var(--danger)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)' }}>{up ? '↑' : '↓'}</span>
      {Math.abs(delta)}
    </span>
  )
}

