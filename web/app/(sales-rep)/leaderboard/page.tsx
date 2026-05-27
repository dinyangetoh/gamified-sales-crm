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

export default function LeaderboardPage() {
  const { session } = useSession()
  const userId = session?.sub

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

  const myEntry = useMemo(() => {
    if (!data || !userId) return null
    return data.entries.find((e) => e.userId === userId) ?? null
  }, [data, userId])

  return (
    <AppShell role="rep" active="leaderboard" title="Leaderboard" sub={mode === 'weekly' ? 'This week ranking' : 'All-time ranking'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant={mode === 'weekly' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => setMode('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={mode === 'all-time' ? 'solid' : 'ghost'}
            size="sm"
            onClick={() => setMode('all-time')}
          >
            All-time
          </Button>
        </div>

        {myEntry && (
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 12 }}>
            You are currently <span style={{ color: 'var(--ink)', fontWeight: 900 }}>#{myEntry.rank}</span>
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
        <Card
          title={mode === 'weekly' ? `Week ${data.week ?? ''}` : 'All-time'}
          subtitle="Rank, level, and badge highlights"
        >
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
                  const isMe = e.userId === userId
                  return (
                    <tr key={e.userId} style={{ background: isMe ? 'var(--bg-sub)' : undefined }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800 }}>
                        {e.rank}
                      </td>
                      <td style={{ padding: '10px 12px', minWidth: 180 }}>
                        <div style={{ fontWeight: 800 }}>{e.name}</div>
                        <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                          Streak: {e.currentStreak}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800 }}>{e.levelLabel}</div>
                        <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>L{e.level}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                        {e.pointsGap}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {e.badges.slice(0, 3).map((b) => (
                            <BadgeIcon key={b.type} type={b.type} size={32} />
                          ))}
                          {e.badges.length > 3 && <span style={{ color: 'var(--muted)', fontSize: 12 }}>+{e.badges.length - 3}</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  )
}


