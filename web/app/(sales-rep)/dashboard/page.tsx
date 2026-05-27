'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import LevelChip from '@/components/ui/LevelChip'
import Streak from '@/components/ui/Streak'
import BadgeIcon from '@/components/ui/BadgeIcon'
import EventSimulator from '@/components/rep/EventSimulator'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'

type UserProfileResponse = {
  userId: string
  name: string
  email: string
  role: string
  stats: { totalXP: number; totalPoints: number; level: number; currentStreak: number; longestStreak: number } | null
  badges: {
    earned: Array<{ type: string; displayName: string; iconUrl: string; description: string; awardedAt?: string }>
    inProgress: Array<{ type: string; displayName: string; iconUrl: string; currentCount?: number; targetCount?: number; progressPercent?: number; weekKey?: string | null }>
    locked: Array<{ type: string; displayName: string; iconUrl: string }>
  }
}

type TimelineResponse = {
  timeline: Array<{
    id: string
    type: string
    badgeType: string | null
    displayName?: string
    iconUrl?: string
    pointsSnapshot: number
    xpSnapshot: number
    levelSnapshot: number
    weekKey: string | null
    metadata: object | null
    createdAt: string
  }>
}

type LeaderboardResponse = {
  week: string
  entries: Array<{
    rank: number
    userId: string
    name: string
    level: number
    levelLabel: string
    currentStreak: number
    pointsGap: number
    weekPoints: number
    totalXP: number
    badges: Array<{ type: string; displayName: string; iconUrl: string }>
  }>
}

export default function DashboardPage() {
  const { session, loading } = useSession()
  const userId = session?.sub

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function load() {
      setErr(null)
      try {
        const [p, t, lb] = await Promise.all([
          apiFetch<UserProfileResponse>(`/users/${userId}`),
          apiFetch<TimelineResponse>(`/users/${userId}/timeline?limit=10&offset=0`),
          apiFetch<LeaderboardResponse>('/leaderboard'),
        ])
        if (cancelled) return
        setProfile(p)
        setTimeline(t)
        setLeaderboard(lb)
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

  return (
    <AppShell role="rep" active="dashboard" title="Dashboard" sub="XP, level, badges, and timeline">
      {loading && (
        <Card title="Loading…" subtitle="Fetching your current stats." padded={false}>
          <div />
        </Card>
      )}
      {err && (
        <Card title="Could not load" subtitle={err}>
          Please try reloading the page.
        </Card>
      )}

      {!loading && !err && profile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card
              title={`${profile.name}`}
              subtitle={`Level ${profile.stats?.level ?? 1} · ${profile.role}`}
              action={<LevelChip level={profile.stats?.level ?? 1} label={myEntry?.levelLabel ?? '—'} size="md" />}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Total XP
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800 }}>{profile.stats?.totalXP ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Current streak
                    </div>
                    <div style={{ marginTop: 2 }}>
                      <Streak days={profile.stats?.currentStreak ?? 0} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Weekly rank
                    </div>
                    <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800 }}>
                      {myEntry ? `#${myEntry.rank}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <EventSimulator
                  userId={userId!}
                  onSent={() => {
                    // Refresh the data when an event is processed.
                    apiFetch(`/users/${userId}`)
                      .then((p) => setProfile(p as UserProfileResponse))
                      .catch(() => undefined)
                    apiFetch(`/users/${userId}/timeline?limit=10&offset=0`)
                      .then((t) => setTimeline(t as TimelineResponse))
                      .catch(() => undefined)
                    apiFetch('/leaderboard')
                      .then((lb) => setLeaderboard(lb as LeaderboardResponse))
                      .catch(() => undefined)
                  }}
                />
              </div>
            </Card>

            <Card title="Recent timeline" subtitle="Your latest badge / streak / level events">
              {!timeline ? (
                <div style={{ color: 'var(--muted)' }}>No timeline available.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {timeline.timeline.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        background: 'var(--surface-2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {e.badgeType ? <BadgeIcon type={e.badgeType} size={34} locked={false} /> : <div style={{ width: 34 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.displayName ?? e.type}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {e.weekKey ? `${e.weekKey} · ` : ''}
                            +{e.pointsSnapshot} pts · lvl {e.levelSnapshot}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {new Date(e.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Badges" subtitle="Earned, in progress, and locked">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Earned
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                    {profile.badges.earned.length === 0 ? (
                      <div style={{ color: 'var(--muted)' }}>—</div>
                    ) : (
                      profile.badges.earned.map((b) => (
                        <div key={b.type} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                          <BadgeIcon type={b.type} size={44} locked={false} />
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-2)', textAlign: 'center' }}>{b.displayName}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    In progress
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                    {profile.badges.inProgress.length === 0 ? (
                      <div style={{ color: 'var(--muted)' }}>—</div>
                    ) : (
                      profile.badges.inProgress.map((b) => (
                        <div key={b.type} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                          <BadgeIcon type={b.type} size={44} locked={false} />
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-2)', textAlign: 'center' }}>{b.displayName}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Locked
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                    {profile.badges.locked.slice(0, 10).map((b) => (
                      <BadgeIcon key={b.type} type={b.type} size={36} locked />
                    ))}
                    {profile.badges.locked.length > 10 && <div style={{ color: 'var(--muted)', fontSize: 12 }}>+{profile.badges.locked.length - 10} more</div>}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Weekly leaderboard" subtitle={leaderboard?.week ? `Week ${leaderboard.week}` : '—'}>
              {myEntry ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Rank
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900 }}>{`#${myEntry.rank}`}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Points gap
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900 }}>
                      {myEntry.pointsGap ?? 0} pts
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Badge unlocked this week
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {myEntry.badges.length === 0 ? <div style={{ color: 'var(--muted)' }}>—</div> : myEntry.badges.map((b) => <BadgeIcon key={b.type} type={b.type} size={40} />)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--muted)' }}>No leaderboard row yet.</div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  )
}

