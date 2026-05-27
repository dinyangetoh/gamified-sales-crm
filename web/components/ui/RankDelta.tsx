import { Icon } from '@/components/ui/Icon'

export default function RankDelta({ delta }: { delta: number | null | undefined }) {
  if (delta === 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--muted)', fontSize: 11 }}>
        {Icon.arrow(0)} —
      </span>
    )
  }
  if (delta === null || delta === undefined) {
    return <span style={{ color: 'var(--muted-2)', fontSize: 11 }}>—</span>
  }

  const up = delta > 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        color: up ? 'var(--success)' : 'var(--danger)',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {Icon.arrow(up ? 1 : -1)}
      <span className="num">{Math.abs(delta)}</span>
    </span>
  )
}
