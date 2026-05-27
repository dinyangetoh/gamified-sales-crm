'use client'

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        height: 30,
        borderRadius: 7,
        border: '1px solid var(--border-strong)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0 14px',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--accent-fg)' : 'var(--ink-2)',
              border: 'none',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
