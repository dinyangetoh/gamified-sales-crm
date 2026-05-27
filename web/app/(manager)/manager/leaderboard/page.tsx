'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import BadgeIcon from '@/components/ui/BadgeIcon'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import Button from '@/components/ui/Button'

type LeaderboardResponse = {
  week?: string
  generatedAt: string | Date
  fromCache: boolean
  entries: Array<{
    rank: number
    userId: string
    name: string
    weekPoints?: number
    totalXP?: number
    level: number
    levelLabel: string
    currentStreak: number
    pointsGap: number
    badges: Array<{ type: string; displayName: string; iconUrl: string }>
  }>
}

export default function ManagerLeaderboardPage() {
  const { session } = useSession()
  const actorId = session?.sub

  const [mode, setMode] = useState<'weekly' | 'all-time'>('weekly')
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const endpoint = useMemo(() => (mode === 'weekly' ? '/leaderboard' : '/leaderboard/all-time'), [mode])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<LeaderboardResponse>(endpoint)
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load leaderboard')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [endpoint])

  const top3 = data?.entries.slice(0, 3) ?? []
  const actorRow = data?.entries.find((e) => e.userId === actorId) ?? null

  return (
    <AppShell role="manager" active="leaderboard" title="Leaderboard" sub="Team ranking">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant={mode === 'weekly' ? 'solid' : 'ghost'} size="sm" onClick={() => setMode('weekly')}>
            Weekly
          </Button>
          <Button variant={mode === 'all-time' ? 'solid' : 'ghost'} size="sm" onClick={() => setMode('all-time')}>
            All-time
          </Button>
        </div>

        {actorRow && (
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 12 }}>
            You are at <span style={{ color: 'var(--ink)', fontWeight: 900 }}>#{actorRow.rank}</span>
          </div>
        )}
      </div>

      {err && (
        <Card title="Could not load" subtitle={err}>
          Please try reloading the page.
        </Card>
      )}

      {!err && !data && <Card title="Loading…" subtitle="Fetching leaderboard"> </Card>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title={mode === 'weekly' ? `Top performers — ${data.week ?? ''}` : 'Top performers — All-time'} subtitle="Top 3 reps">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {top3.length === 0 ? (
                <div style={{ color: 'var(--muted)' }}>No leaderboard data yet.</div>
              ) : (
                top3.map((e, idx) => (
                  <div
                    key={e.userId}
                    style={{
                      flex: '1 1 220px',
                      minWidth: 220,
                      padding: '12px 12px',
                      borderRadius: 14,
                      border: '1px solid var(--border)',
                      background: idx === 0 ? 'var(--surface-2)' : 'var(--surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--muted)' }}>
                        #{e.rank}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
                        {e.levelLabel}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 900 }}>{e.name}</div>
                    <div style={{ marginTop: 4, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      Streak {e.currentStreak} · Gap {e.pointsGap}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {e.badges.slice(0, 3).map((b) => (
                        <BadgeIcon key={b.type} type={b.type} size={30} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title={mode === 'weekly' ? `Weekly leaderboard — ${data.week ?? ''}` : 'All-time leaderboard'} subtitle="Full ranking table">
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    {['Rank', 'Rep', 'Level', 'Gap', 'Badges'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e) => {
                    const isActor = e.userId === actorId
                    return (
                      <tr key={e.userId} style={{ background: isActor ? 'var(--bg-sub)' : undefined }}>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800 }}>{e.rank}</td>
                        <td style={{ padding: '10px 12px', minWidth: 180 }}>
                          <div style={{ fontWeight: 800 }}>{e.name}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 900 }}>{e.levelLabel}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{e.pointsGap}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {e.badges.slice(0, 3).map((b) => (
                              <BadgeIcon key={b.type} type={b.type} size={28} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  )
}


