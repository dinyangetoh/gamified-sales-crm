'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import EventSimulator from '@/components/rep/EventSimulator'
import RepHeroGrid from '@/components/rep/RepHeroGrid'
import BadgeProgressCard from '@/components/rep/BadgeProgressCard'
import BadgeCollectionGrid from '@/components/rep/BadgeCollectionGrid'
import AchievementsTimeline from '@/components/rep/AchievementsTimeline'
import PersonalRecordsStrip from '@/components/rep/PersonalRecordsStrip'
import DualBarChart from '@/components/charts/DualBarChart'
import { MY_PREV_WEEK, MY_WEEK_PTS } from '@/lib/design/repDemo'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import { Icon } from '@/components/ui/Icon'

type UserProfileResponse = {
  userId: string
  name: string
  email: string
  role: string
  stats: {
    totalXP: number
    totalPoints: number
    level: number
    currentStreak: number
    longestStreak: number
  } | null
  badges: {
    earned: Array<{ type: string; displayName: string; awardedAt?: string }>
    inProgress: Array<{ type: string; displayName: string; currentCount?: number; targetCount?: number }>
    locked: Array<{ type: string }>
  }
}

type TimelineResponse = {
  timeline: Array<{
    id: string
    type: string
    badgeType: string | null
    displayName?: string
    pointsSnapshot: number
    weekKey: string | null
    metadata: object | null
    createdAt: string
  }>
}

type LeaderboardResponse = {
  entries: Array<{
    rank: number
    userId: string
    name: string
    weekPoints: number
    pointsGap: number
    level: number
    levelLabel: string
    rankDelta?: number
    lastWeekRank?: number
  }>
}

type LevelConfig = { level: number; minXP: number; label: string }

export default function DashboardPage() {
  const { session, loading } = useSession()
  const userId = session?.sub

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [levelConfigs, setLevelConfigs] = useState<LevelConfig[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      setErr(null)
      try {
        const [p, t, lb, levels] = await Promise.all([
          apiFetch<UserProfileResponse>(`/users/${userId}`),
          apiFetch<TimelineResponse>(`/users/${userId}/timeline?limit=10&offset=0`),
          apiFetch<LeaderboardResponse>('/leaderboard'),
          apiFetch<LevelConfig[]>('/config/levels'),
        ])
        if (cancelled) return
        setProfile(p)
        setTimeline(t)
        setLeaderboard(lb)
        setLevelConfigs(levels.sort((a, b) => a.level - b.level))
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load dashboard')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const myEntry = leaderboard?.entries.find((e) => e.userId === userId) ?? null
  const behindMe = myEntry ? leaderboard?.entries.find((e) => e.rank === myEntry.rank + 1) : undefined

  const nextBadge = useMemo(() => {
    const list = profile?.badges.inProgress ?? []
    if (!list.length) return null
    return [...list].sort(
      (a, b) =>
        (b.currentCount ?? 0) / (b.targetCount ?? 1) - (a.currentCount ?? 0) / (a.targetCount ?? 1),
    )[0]
  }, [profile])

  const rankDelta = myEntry?.rankDelta ?? (myEntry?.lastWeekRank != null ? myEntry.lastWeekRank - myEntry.rank : undefined)

  return (
    <AppShell
      role="rep"
      active="dashboard"
      title={profile ? `Good afternoon, ${profile.name.split(' ')[0]}` : 'Dashboard'}
      sub="Week · Acme Sales"
      actions={
        <button type="button" className="btn sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {Icon.bolt}
          <span>Log event</span>
        </button>
      }
    >
      {loading && <Card title="Loading…" subtitle="Fetching your stats"> </Card>}
      {err && <Card title="Could not load" subtitle={err} />}

      {!loading && !err && profile && (
        <>
          <RepHeroGrid
            name={profile.name}
            totalXP={profile.stats?.totalXP ?? 0}
            level={profile.stats?.level ?? 1}
            levelLabel={myEntry?.levelLabel ?? 'Rookie'}
            levelConfigs={levelConfigs}
            rank={myEntry?.rank ?? 1}
            rankedCount={leaderboard?.entries.length ?? 1}
            rankDelta={rankDelta}
            pointsGap={myEntry?.pointsGap ?? 0}
            behindName={behindMe?.name}
            behindGap={behindMe && myEntry ? myEntry.weekPoints - behindMe.weekPoints : undefined}
            weekPoints={myEntry?.weekPoints ?? profile.stats?.totalPoints ?? 0}
            currentStreak={profile.stats?.currentStreak ?? 0}
            longestStreak={profile.stats?.longestStreak ?? 0}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginBottom: 14 }}>
            {nextBadge && nextBadge.targetCount != null && (
              <BadgeProgressCard
                type={nextBadge.type}
                current={nextBadge.currentCount ?? 0}
                target={nextBadge.targetCount}
              />
            )}
            <Card
              title="Your week"
              subtitle="Points scored per day · sample comparison"
              action={
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--lv4)' }} />
                    This week
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <i style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--muted-2)' }} />
                    Last week
                  </span>
                </div>
              }
            >
              <DualBarChart
                thisWeek={MY_WEEK_PTS}
                lastWeek={MY_PREV_WEEK}
                labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                width={520}
                height={160}
              />
            </Card>
          </div>

          <PersonalRecordsStrip weekPoints={myEntry?.weekPoints ?? 0} />

          <BadgeCollectionGrid earned={profile.badges.earned} inProgress={profile.badges.inProgress} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginTop: 14 }}>
            <AchievementsTimeline items={timeline?.timeline ?? []} />
            <Card title="Event simulator" subtitle="Trial-fire a CRM event">
              {userId && <EventSimulator userId={userId} onSent={() => window.location.reload()} />}
            </Card>
          </div>
        </>
      )}
    </AppShell>
  )
}
