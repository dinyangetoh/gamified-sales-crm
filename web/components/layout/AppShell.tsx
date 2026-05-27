'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Logo from '@/components/ui/Logo'
import Avatar from '@/components/ui/Avatar'
import type { JwtPayload, JwtRole } from '@/lib/api/jwt'
import { decodeJwtPayload } from '@/lib/api/jwt'
import { getAccessToken, clearAccessToken } from '@/lib/api/tokenStorage'
import type { ReactNode } from 'react'
import Button from '@/components/ui/Button'

const repNav = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard' },
  { id: 'activity', label: 'Activity', href: '/activity' },
]

const managerNav = [
  { id: 'dashboard', label: 'Overview', href: '/manager/dashboard' },
  { id: 'leaderboard', label: 'Leaderboard', href: '/manager/leaderboard' },
  { id: 'reps', label: 'Reps', href: '/manager/reps' },
  { id: 'rules', label: 'Rules', href: '/manager/rules' },
  { id: 'emails', label: 'Email templates', href: '/manager/emails' },
]

function initialsFromEmail(email: string) {
  const left = email.split('@')[0] || email
  const parts = left.split(/[._-]/g).filter(Boolean)
  const a = parts[0]?.[0] ?? left[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export default function AppShell({
  role,
  active,
  title,
  sub,
  actions,
  children,
}: {
  role: 'rep' | 'manager'
  active?: string
  title: string
  sub?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const [jwt, setJwt] = useState<JwtPayload | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) return setJwt(null)
    const payload = decodeJwtPayload(token)
    setJwt(payload)
  }, [])

  const nav = role === 'manager' ? managerNav : repNav
  const roleText: JwtRole = role === 'manager' ? 'MANAGER' : 'SALES_REP'

  const userInitials = useMemo(() => {
    if (!jwt?.email) return '??'
    return initialsFromEmail(jwt.email)
  }, [jwt?.email])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside
          style={{
            width: 248,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            padding: '14px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 14px' }}>
            <Logo size={22} />
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nav.map((item) => (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: active === item.id ? 'var(--bg-sub)' : 'transparent',
                    color: active === item.id ? 'var(--ink)' : 'var(--ink-2)',
                    border: active === item.id ? '1px solid var(--border)' : '1px solid transparent',
                    fontSize: 13,
                    fontWeight: active === item.id ? 700 : 600,
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: active === item.id ? 'var(--lv4)' : 'var(--divider)' }} />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: 18, borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={jwt?.email ?? 'User'} initials={userInitials} size={30} tone={role === 'manager' ? 'lv-3' : 'lv-4'} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {jwt?.email ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{roleText}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button
                variant="ghost"
                size="sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  clearAccessToken()
                  window.location.href = '/login'
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, padding: 18 }}>
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                {role === 'manager' ? 'Manager' : 'Sales rep'}
              </div>
              <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
              {sub && <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--muted)' }}>{sub}</div>}
            </div>
            {actions}
          </header>

          <section>{children}</section>
        </main>
      </div>
    </div>
  )
}

