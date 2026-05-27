'use client'

import { Icon } from '@/components/ui/Icon'

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  width = 240,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  width?: number
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 30,
        padding: '0 10px',
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 7,
        width,
        color: 'var(--muted)',
      }}
    >
      {Icon.search}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: 'none',
          outline: 'none',
          flex: 1,
          background: 'transparent',
          fontSize: 12.5,
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
        }}
      />
    </div>
  )
}
