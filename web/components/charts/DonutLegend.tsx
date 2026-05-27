import type { DonutSegment } from '@/components/charts/Donut'

export default function DonutLegend({ data, total }: { data: DonutSegment[]; total?: number }) {
  const sum = total ?? (data.reduce((s, d) => s + d.value, 0) || 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11.5, color: 'var(--ink-2)' }}>{d.label}</span>
          <span className="num" style={{ fontSize: 11.5, fontWeight: 600 }}>
            {d.value}
          </span>
          <span className="num" style={{ fontSize: 10.5, color: 'var(--muted)', width: 36, textAlign: 'right' }}>
            {Math.round((d.value / sum) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
