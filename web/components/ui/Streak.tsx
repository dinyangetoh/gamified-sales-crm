import { Icon } from '@/components/ui/Icon'

export default function Streak({ days, atRisk }: { days?: number | null; atRisk?: boolean }) {
  if (!days) return <span style={{ color: 'var(--muted-2)', fontSize: 12 }}>—</span>
  const color = atRisk ? 'var(--warn)' : days >= 7 ? 'var(--flame)' : 'var(--ink-2)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: 12, fontWeight: 500 }}>
      <span style={{ display: 'inline-flex' }}>{Icon.flame}</span>
      <span className="num">{days}</span>
    </span>
  )
}
