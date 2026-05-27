import type { ReactNode } from 'react'
import Sparkline from '@/components/charts/Sparkline'

export default function StatWithTrend({
  label,
  value,
  unit,
  delta,
  trend,
  color = 'var(--ink)',
}: {
  label: string
  value: ReactNode
  unit?: string
  delta?: number
  trend?: number[]
  color?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 6 }}>
          <span className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color }}>
            {value}
          </span>
          {unit && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{unit}</span>}
          {delta !== undefined && (
            <span
              className="num"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--muted)',
              }}
            >
              {delta > 0 ? '+' : ''}
              {delta}%
            </span>
          )}
        </div>
      </div>
      {trend && (
        <div style={{ color, opacity: 0.75 }}>
          <Sparkline data={trend} width={70} height={24} color={color} fill={color} />
        </div>
      )}
    </div>
  )
}
