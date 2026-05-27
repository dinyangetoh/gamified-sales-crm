'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import BadgeIcon from '@/components/ui/BadgeIcon'
import { apiFetch } from '@/lib/api/client'

type SalesRepSummary = {
  userId: string
  name: string
  email: string
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  badgeCount: number
  eventCount?: number
  lastActivityAt?: string
}

export default function ManagerRepsPage() {
  const [data, setData] = useState<SalesRepSummary[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<SalesRepSummary[]>('/manager/reps')
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load reps')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => b.totalXP - a.totalXP)
  }, [data])

  return (
    <AppShell role="manager" active="reps" title="Reps" sub="Roster and rep details">
      {err && (
        <Card title="Could not load" subtitle={err}>
          Please try reloading the page.
        </Card>
      )}

      {!err && !data && <Card title="Loading…" subtitle="Fetching reps"> </Card>}

      {data && (
        <Card title="Sales reps" subtitle="XP, streak, and badge progress (eventCount shown once API gap is closed)">
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Rep', 'Level', 'Streak', 'Badges', 'Events', 'Last activity', 'XP'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.userId} style={{ background: 'transparent' }}>
                    <td style={{ padding: '10px 12px', minWidth: 240 }}>
                      <div style={{ fontWeight: 900 }}>{r.name}</div>
                      <div style={{ marginTop: 2, fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--muted)' }}>
                        {r.email}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{`L${r.level}`}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                      {r.currentStreak}d <span style={{ color: 'var(--muted)' }}>· best {r.longestStreak}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BadgeIcon type="BADGES" size={32} locked={false} />
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>{r.badgeCount}</div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 900 }}>
                      {r.eventCount ?? 0}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                      {r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
                      {r.totalXP}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  )
}


