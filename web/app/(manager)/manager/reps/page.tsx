'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import SearchField from '@/components/ui/SearchField'
import Avatar from '@/components/ui/Avatar'
import LevelChip from '@/components/ui/LevelChip'
import Streak from '@/components/ui/Streak'
import BadgeIcon from '@/components/ui/BadgeIcon'
import { Icon, initialsFromName, levelTone } from '@/components/ui/Icon'
import { apiFetch } from '@/lib/api/client'

type SalesRepSummary = {
  userId: string
  name: string
  email: string
  totalXP: number
  weekPoints?: number
  level: number
  levelLabel?: string
  currentStreak: number
  longestStreak: number
  badgeCount: number
  eventCount?: number
  lastActivityAt?: string
}

export default function ManagerRepsPage() {
  const [data, setData] = useState<SalesRepSummary[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    const list = [...data].sort((a, b) => (b.weekPoints ?? b.totalXP) - (a.weekPoints ?? a.totalXP))
    if (!q) return list
    return list.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q))
  }, [data, search])

  return (
    <AppShell
      role="manager"
      active="reps"
      title="Sales reps"
      sub={data ? `${data.length} active across the team` : 'Loading roster'}
      actions={<SearchField value={search} onChange={setSearch} placeholder="Search reps…" />}
    >
      {err && <Card title="Could not load" subtitle={err} />}
      {!err && !data && <Card title="Loading…" subtitle="Fetching reps"> </Card>}

      {data && (
        <Card padded={false}>
          <DataTable
            gridTemplateColumns="1.6fr 110px 90px 90px 90px 100px 80px 40px"
            rows={filtered}
            rowKey={(r) => r.userId}
            columns={[
              {
                key: 'rep',
                header: 'Rep',
                render: (r) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={r.name} initials={initialsFromName(r.name)} size={28} tone={levelTone(r.level)} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{r.email}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: 'level',
                header: 'Level',
                render: (r) => <LevelChip level={r.level} label={r.levelLabel ?? `L${r.level}`} size="sm" />,
              },
              {
                key: 'week',
                header: 'Week pts',
                align: 'right',
                render: (r) => (
                  <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                    {r.weekPoints ?? '—'}
                  </span>
                ),
              },
              {
                key: 'xp',
                header: 'Total XP',
                align: 'right',
                render: (r) => (
                  <span className="num" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    {r.totalXP}
                  </span>
                ),
              },
              {
                key: 'streak',
                header: 'Streak',
                align: 'center',
                render: (r) => (
                  <Streak days={r.currentStreak} atRisk={r.currentStreak === 0 && r.longestStreak > 0} />
                ),
              },
              {
                key: 'badges',
                header: 'Badges',
                align: 'center',
                render: (r) => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                    {r.badgeCount > 0 ? (
                      <BadgeIcon type="FIRST_WIN" size={18} />
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>—</span>
                    )}
                    <span className="num" style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {r.badgeCount}
                    </span>
                  </div>
                ),
              },
              {
                key: 'events',
                header: 'Events',
                align: 'right',
                render: (r) => (
                  <span className="num" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {r.eventCount ?? 0}
                  </span>
                ),
              },
              {
                key: 'chev',
                header: '',
                align: 'right',
                render: () => <span style={{ color: 'var(--muted)', display: 'inline-flex' }}>{Icon.chev}</span>,
              },
            ]}
          />
        </Card>
      )}
    </AppShell>
  )
}
