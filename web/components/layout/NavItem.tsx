'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export default function NavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
  badge?: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '7px 10px',
          borderRadius: 7,
          background: active ? 'var(--bg-sub)' : 'transparent',
          color: active ? 'var(--ink)' : 'var(--ink-2)',
          fontSize: 13,
          fontWeight: active ? 500 : 450,
          transition: 'background .12s',
        }}
      >
        <span style={{ color: active ? 'var(--ink)' : 'var(--muted)', display: 'inline-flex' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge && (
          <span className="chip" style={{ height: 18, padding: '0 6px', fontSize: 10, background: 'var(--bg)', color: 'var(--muted)' }}>
            {badge}
          </span>
        )}
      </span>
    </Link>
  )
}
