'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import SegmentedControl from '@/components/ui/SegmentedControl'
import Podium, { type PodiumEntry } from '@/components/leaderboard/Podium'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import { getLeaderboardDetail } from '@/lib/design/managerLeaderboardDemo'

type LeaderboardResponse = {
  week?: string
  entries: Array<{
    rank: number
    userId: string
    name: string
    weekPoints?: number
    totalXP?: number
    level: number
    levelLabel: string
    currentStreak: number
    rankDelta?: number
    lastWeekRank?: number
    badges: Array<{ type: string }>
  }>
}

export default function ManagerLeaderboardPage() {
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

  const entries: PodiumEntry[] = useMemo(
    () =>
      (data?.entries ?? []).map((e) => ({
        ...getLeaderboardDetail(e.name),
        userId: e.userId,
        name: e.name,
        rank: e.rank,
        weekPoints: e.weekPoints ?? e.totalXP ?? 0,
        level: e.level,
        levelLabel: e.levelLabel,
        currentStreak: e.currentStreak,
        rankDelta: e.rankDelta,
        lastWeekRank: e.lastWeekRank,
        badges: e.badges,
      })),
    [data],
  )

  const podiumStats = useMemo(() => {
    if (mode !== 'weekly' || entries.length === 0) return []
    const total = entries.reduce((sum, entry) => sum + entry.weekPoints, 0)
    const sorted = entries.map((entry) => entry.weekPoints).sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid]
    const leaderGap = entries.length > 1 ? entries[0].weekPoints - entries[1].weekPoints : 0
    return [
      { label: 'until close', value: '2d 9h' },
      { label: 'Total', value: `${total}` },
      { label: 'Median', value: `${median}` },
      { label: 'Leader gap', value: `${leaderGap} pts` },
    ]
  }, [entries, mode])

  return (
    <AppShell
      role="manager"
      active="leaderboard"
      title="Leaderboard"
      sub="Team rankings across the week · Acme Sales"
      actions={
        <SegmentedControl
          options={[
            { value: 'weekly' as const, label: 'This week' },
            { value: 'all-time' as const, label: 'All time' },
          ]}
          value={mode}
          onChange={setMode}
        />
      }
    >
      {err && <Card title="Could not load" subtitle={err} />}
      {!err && !data && <Card title="Loading…" subtitle="Fetching leaderboard"> </Card>}

      {data && mode === 'weekly' && entries.length >= 3 && (
        <>
          <Podium
            entries={entries}
            currentUserId={userId}
            showDelta
            subtitle={`Week ${data.week ?? ''} standings`}
            title="Top performers"
            statsRow={podiumStats}
          />
          <Card title="Full standings" subtitle={`All ${entries.length} reps · sorted by week points`} padded={false}>
            <LeaderboardTable entries={entries} currentUserId={userId} showDelta detailed includePodium />
          </Card>
        </>
      )}

      {data && (mode === 'all-time' || entries.length < 3) && (
        <Card title={mode === 'weekly' ? `Week ${data.week ?? ''}` : 'All-time'} subtitle="Full rankings">
          <LeaderboardTable
            entries={entries}
            currentUserId={userId}
            showWeekPoints={mode === 'weekly'}
            showDelta={mode === 'weekly'}
            includePodium
            detailed={mode === 'weekly'}
          />
        </Card>
      )}
    </AppShell>
  )
}
