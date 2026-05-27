'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { setAccessToken } from '@/lib/api/tokenStorage'
import { decodeJwtPayload, type JwtRole } from '@/lib/api/jwt'
import Logo from '@/components/ui/Logo'
import Avatar from '@/components/ui/Avatar'
import type { FormEvent } from 'react'

type LoginResponse = { accessToken: string }

const DEMO_ACCOUNTS = [
  { name: 'Alice Smith', email: 'alice@demo.com', role: 'Sales Rep · Legend', tone: 'lv-4' as const },
  { name: 'Morgan Vale', email: 'manager@demo.com', role: 'Manager', tone: 'lv-3' as const },
  { name: 'Hannah Lee', email: 'hannah@demo.com', role: 'Sales Rep · Rookie', tone: 'lv-1' as const },
]

function roleToPath(role: JwtRole) {
  if (role === 'MANAGER') return '/admin/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('alice@demo.com')
  const [password, setPassword] = useState('Demo1234!')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      if (!res?.accessToken) throw new Error('No accessToken returned')
      setAccessToken(res.accessToken)
      const payload = decodeJwtPayload(res.accessToken)
      if (!payload) throw new Error('Unable to decode JWT role')
      router.replace(roleToPath(payload.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
      }}
    >
      <header style={{ padding: '24px 32px' }}>
        <Logo size={22} />
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Sign in to Rally</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              CRM activity, levels and weekly rankings — all in one place.
            </p>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>Work email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
            </label>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--danger-soft)',
                  color: 'var(--danger)',
                  borderRadius: 8,
                  fontSize: 13,
                  border: '1px solid rgba(185,74,59,0.35)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                height: 38,
                marginTop: 4,
                justifyContent: 'center',
                borderRadius: 8,
                fontSize: 13,
                opacity: loading ? 0.7 : 1,
                color: '#f2f2f2',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              padding: '12px 14px',
              background: 'var(--surface)',
              border: '1px dashed var(--border-strong)',
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
              }}
            >
              Demo accounts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email)
                    setPassword('Demo1234!')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Avatar name={a.name} initials={a.name.split(' ').map((s) => s[0]).join('')} size={22} tone={a.tone} />
                  <span style={{ flex: 1, color: 'var(--ink-2)' }} className="num">
                    {a.email}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{a.role}</span>
                </button>
              ))}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>password: Demo1234!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 13,
  color: 'var(--ink)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
}
