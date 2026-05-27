import type { ReactNode } from 'react'

export default function Stat({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
  tone?: 'flame' | 'success' | 'lv-4' | string
}) {
  const color =
    tone === 'flame' ? 'var(--flame)' : tone === 'success' ? 'var(--success)' : tone === 'lv-4' ? 'var(--lv4)' : 'var(--ink)'

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}
