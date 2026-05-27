'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { getApiBaseUrl } from '@/lib/api/baseUrl'
import { setAccessToken } from '@/lib/api/tokenStorage'
import { decodeJwtPayload, type JwtRole } from '@/lib/api/jwt'
import type { FormEvent } from 'react'

type LoginResponse = { accessToken: string }

function demoAccounts() {
  return [
    { label: 'Alice (Sales Rep)', email: 'alice@demo.com', password: 'Demo1234!' },
    { label: 'Manager', email: 'manager@demo.com', password: 'Demo1234!' },
    { label: 'Hannah (Sales Rep)', email: 'hannah@demo.com', password: 'Demo1234!' },
  ]
}

function roleToPath(role: JwtRole) {
  if (role === 'MANAGER') return '/manager/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('alice@demo.com')
  const [password, setPassword] = useState('Demo1234!')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), [])

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
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 22, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Sign in
            </div>
            <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Rally
            </h1>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{apiBaseUrl}</div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 600 }}>Work email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: 13,
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 600 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: 13,
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                borderRadius: 10,
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
            style={{ opacity: loading ? 0.7 : 1, height: 40, justifyContent: 'center' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 18, borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Demo accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {demoAccounts().map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email)
                  setPassword(a.password)
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650 }}>{a.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{a.email}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

