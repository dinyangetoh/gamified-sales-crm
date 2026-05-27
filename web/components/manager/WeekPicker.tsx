'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { formatWeekLabel, recentIsoWeeks } from '@/lib/design/weekUtils'

export default function WeekPicker({ value, onChange }: { value: string; onChange: (week: string) => void }) {
  const [open, setOpen] = useState(false)
  const weeks = recentIsoWeeks(8)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn ghost sm"
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px', fontSize: 12 }}
      >
        {Icon.clock}
        <span className="num">{formatWeekLabel(value)}</span>
        <span style={{ color: 'var(--muted)', display: 'inline-flex' }}>{Icon.chev}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
            minWidth: 120,
            padding: 4,
          }}
        >
          {weeks.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                onChange(w)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 10px',
                border: 'none',
                background: w === value ? 'var(--bg-sub)' : 'transparent',
                textAlign: 'left',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 6,
              }}
              className="num"
            >
              {formatWeekLabel(w)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
