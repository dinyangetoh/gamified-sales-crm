'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Toast from '@/components/ui/Toast'
import EmailDemoCard from '@/components/admin/EmailDemoCard'
import AdminAnalyticsDashboard from '@/components/admin/AdminAnalyticsDashboard'
import WeekPicker from '@/components/admin/WeekPicker'
import RepFilter from '@/components/admin/RepFilter'
import ExportButton from '@/components/admin/ExportButton'
import Card from '@/components/ui/Card'
import { apiFetch } from '@/lib/api/client'
import { recentIsoWeeks } from '@/lib/design/weekUtils'

type ManagerOverviewResponse = {
  top3?: Array<{
    userId: string
    name: string
    weekPoints?: number
    rank: number
    levelLabel?: string
    currentStreak?: number
    rankDelta?: number
    lastWeekRank?: number
  }>
  atRisk?: Array<{ userId: string; name: string; reason?: string }>
  kpis?: Record<string, unknown>
}

type SalesRepSummary = {
  userId: string
  name: string
  email: string
  level: number
  levelLabel: string
  totalXP: number
  currentStreak: number
  badgeCount: number
  eventCount?: number
}

type WeeklyLeaderboardResponse = {
  entries: Array<{
    userId: string
    weekPoints?: number
  }>
}

type EmailTemplateRegistryItem = {
  templateId: string
  templateDisplayName: string
  role: 'rep' | 'manager'
  status: 'poc' | 'mvp'
  trigger: string
  defaultSubject: string
}

export default function ManagerDashboardPage() {
  const [week, setWeek] = useState(recentIsoWeeks(1)[0] ?? '2025-W21')
  const [overview, setOverview] = useState<ManagerOverviewResponse | null>(null)
  const [reps, setReps] = useState<SalesRepSummary[] | null>(null)
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<WeeklyLeaderboardResponse | null>(null)
  const [templates, setTemplates] = useState<EmailTemplateRegistryItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const [o, r, lb, t] = await Promise.all([
          apiFetch<ManagerOverviewResponse>(`/admin/overview?week=${encodeURIComponent(week)}`),
          apiFetch<SalesRepSummary[]>('/admin/reps'),
          apiFetch<WeeklyLeaderboardResponse>(`/leaderboard?week=${encodeURIComponent(week)}`),
          apiFetch<EmailTemplateRegistryItem[]>('/admin/emails/templates'),
        ])
        if (cancelled) return
        setOverview(o)
        setReps(r)
        setWeeklyLeaderboard(lb)
        setTemplates(t)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load overview')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [week])

  const exportRows = useMemo(() => {
    if (!reps) return []
    const weekPointsByUser = new Map(
      (weeklyLeaderboard?.entries ?? []).map((entry) => [entry.userId, entry.weekPoints ?? 0]),
    )
    return reps.map((r) => ({
      name: r.name,
      email: r.email,
      level: r.levelLabel,
      weekPoints: weekPointsByUser.get(r.userId) ?? 0,
      totalXP: r.totalXP,
      streak: r.currentStreak,
      badges: r.badgeCount,
      events: r.eventCount ?? 0,
    }))
  }, [reps, weeklyLeaderboard])

  const totalEvents = reps?.reduce((s, r) => s + (r.eventCount ?? 0), 0) ?? 0
  const totalPoints = (weeklyLeaderboard?.entries ?? []).reduce((sum, entry) => {
    return sum + (entry.weekPoints ?? 0)
  }, 0)

  const top3 =
    overview?.top3?.map((r) => ({
      userId: r.userId,
      name: r.name,
      rank: r.rank,
      weekPoints: r.weekPoints ?? 0,
      levelLabel: r.levelLabel ?? '—',
      currentStreak: r.currentStreak ?? 0,
      rankDelta: r.rankDelta,
      lastWeekRank: r.lastWeekRank,
    })) ?? []

  return (
    <>
      <AppShell
        role="manager"
        active="dashboard"
        title="Team overview"
        sub={`Acme Sales · ${week}`}
        actions={
          <>
            <RepFilter />
            <WeekPicker value={week} onChange={setWeek} />
            <ExportButton
              filename={`rally-export-${week}.csv`}
              rows={exportRows}
              onDone={() => {
                setToast('Export downloaded')
                setTimeout(() => setToast(null), 2500)
              }}
            />
          </>
        }
      >
        {err && (
          <Card title="Could not load overview" subtitle={err}>
            Check that the API is running.
          </Card>
        )}

        {!err && overview && (
          <>
            <AdminAnalyticsDashboard
              week={week}
              top3={top3}
              atRisk={overview.atRisk ?? []}
              repCount={reps?.length ?? 0}
              totalEvents={totalEvents}
              totalPoints={totalPoints}
              onNudge={(name) => {
                setToast(`Nudge queued (demo) — ${name}`)
                setTimeout(() => setToast(null), 2500)
              }}
            />

            <div style={{ marginTop: 14 }}>
              <EmailDemoCard templates={templates} />
            </div>
          </>
        )}

        {!err && !overview && <Card title="Loading…" subtitle="Fetching team overview"> </Card>}
      </AppShell>
      <Toast message={toast} />
    </>
  )
}
