'use client'

import { useEffect, useMemo, useState } from 'react'
import Logo from '@/components/ui/Logo'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import NavItem from '@/components/layout/NavItem'
import OrgSwitcher from '@/components/manager/OrgSwitcher'
import { Icon } from '@/components/ui/Icon'
import type { JwtPayload, JwtRole } from '@/lib/api/jwt'
import { decodeJwtPayload } from '@/lib/api/jwt'
import { getAccessToken, clearAccessToken } from '@/lib/api/tokenStorage'
import type { ReactNode } from 'react'

const repNav = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Icon.dashboard },
  { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: Icon.trophy },
  { id: 'activity', label: 'Activity', href: '/activity', icon: Icon.list },
]

const managerNav = [
  { id: 'dashboard', label: 'Overview', href: '/manager/dashboard', icon: Icon.dashboard },
  { id: 'leaderboard', label: 'Leaderboard', href: '/manager/leaderboard', icon: Icon.trophy },
  { id: 'reps', label: 'Reps', href: '/manager/reps', icon: Icon.people },
  { id: 'simulator', label: 'Simulator', href: '/manager/simulator', icon: Icon.bolt },
  { id: 'rules', label: 'Rules', href: '/manager/rules', icon: Icon.rules },
  { id: 'emails', label: 'Email Templates', href: '/manager/emails', icon: Icon.mail },
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
    setJwt(decodeJwtPayload(token))
  }, [])

  const nav = role === 'manager' ? managerNav : repNav
  const roleText: JwtRole = role === 'manager' ? 'MANAGER' : 'SALES_REP'

  const userInitials = useMemo(() => {
    if (!jwt?.email) return '??'
    return initialsFromEmail(jwt.email)
  }, [jwt?.email])

  return (
    <div className="app" style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg)' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--bg)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px',
        }}
      >
        <div style={{ padding: '4px 8px 18px' }}>
          <Logo size={22} />
        </div>

        {role === 'manager' && (
          <div style={{ padding: '0 8px 10px' }}>
            <OrgSwitcher />
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
          {nav.map((item) => (
            <NavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={active === item.id}
            />
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 8px',
              borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <Avatar name={jwt?.email ?? 'User'} initials={userInitials} size={30} tone={role === 'manager' ? 'lv-3' : 'lv-4'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {jwt?.email ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{roleText === 'MANAGER' ? 'Manager' : `Sales rep`}</div>
            </div>
          </div>
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
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--surface-2)' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 28px 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.02em', marginBottom: 2 }}>
              {role === 'manager' ? 'Manager' : 'Sales Rep'}
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</h1>
            {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
        </header>
        <div className="scroll" style={{ flex: 1, overflow: 'auto', padding: '22px 28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
