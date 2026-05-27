'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Avatar from '@/components/ui/Avatar'
import RankDelta from '@/components/ui/RankDelta'
import Medal from '@/components/charts/Medal'
import StatWithTrend from '@/components/charts/StatWithTrend'
import DualMetricChart from '@/components/charts/DualMetricChart'
import Donut from '@/components/charts/Donut'
import DonutLegend from '@/components/charts/DonutLegend'
import BarChart from '@/components/charts/BarChart'
import Heatmap from '@/components/charts/Heatmap'
import { Icon, initialsFromName, levelTone } from '@/components/ui/Icon'
import NudgeButton from '@/components/admin/NudgeButton'
import {
  ACTIVITY_HEATMAP,
  DEMO_REPS_BY_ID,
  DOW_ACTIVITY,
  KPI_TRENDS,
  LEVEL_DIST,
  TEAM_EVENT_MIX,
  TEAM_EVENTS_TS,
  TEAM_POINTS_TS,
  TEAM_WEEKS,
  TOP_BY,
} from '@/lib/design/managerAnalyticsDemo'
import { formatWeekLabel } from '@/lib/design/weekUtils'

type OverviewRep = {
  userId: string
  name: string
  rank: number
  weekPoints: number
  levelLabel: string
  currentStreak: number
  rankDelta?: number
  lastWeekRank?: number
}

type AtRiskItem = { userId: string; name: string; reason?: string }

export default function AdminAnalyticsDashboard({
  week,
  top3,
  atRisk,
  repCount,
  totalEvents,
  totalPoints,
  onNudge,
}: {
  week: string
  top3: OverviewRep[]
  atRisk: AtRiskItem[]
  repCount: number
  totalEvents: number
  totalPoints: number
  onNudge: (name: string) => void
}) {
  const weekLabel = formatWeekLabel(week)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'Active reps', value: String(repCount), unit: '', delta: 0, trend: KPI_TRENDS.activeReps, color: 'var(--ink)' },
          { label: 'Events', value: totalEvents, unit: '', delta: 0, trend: KPI_TRENDS.events, color: 'var(--lv2)' },
          {
            label: 'Points awarded',
            value: totalPoints.toLocaleString(),
            unit: '',
            delta: 13,
            trend: KPI_TRENDS.points,
            color: 'var(--lv4)',
          },
          { label: 'Win rate', value: '68%', unit: '', delta: 5, trend: KPI_TRENDS.winRate, color: 'var(--success)' },
          { label: 'Badges earned', value: '3', unit: '· 14 lifetime', delta: 50, trend: KPI_TRENDS.badges, color: 'var(--lv3)' },
        ].map((s) => (
          <Card key={s.label} padded={false}>
            <div style={{ padding: '14px 16px' }}>
              <StatWithTrend label={s.label} value={s.value} unit={s.unit || undefined} delta={s.delta} trend={s.trend} color={s.color} />
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Team activity · 8 week trend"
        subtitle="Points awarded per week · sample data"
        action={
          <Chip>
            <span style={{ fontSize: 10 }}>Sample data</span>
          </Chip>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <DualMetricChart primary={TEAM_POINTS_TS} secondary={TEAM_EVENTS_TS} labels={TEAM_WEEKS} width={900} height={180} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14 }}>
        <Card title="Event mix" subtitle={`${weekLabel} · illustrative`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <Donut data={TEAM_EVENT_MIX} size={140} thickness={18} centerLabel="122" centerSub="events" />
            <div style={{ flex: 1, minWidth: 120 }}>
              <DonutLegend data={TEAM_EVENT_MIX} />
            </div>
          </div>
        </Card>

        <Card title="Level distribution" subtitle={`${repCount} reps`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <Donut data={LEVEL_DIST} size={140} thickness={18} centerLabel={repCount} centerSub="reps" />
            <div style={{ flex: 1, minWidth: 120 }}>
              <DonutLegend data={LEVEL_DIST} />
            </div>
          </div>
        </Card>

        <Card
          title="Top performers"
          subtitle={weekLabel}
          action={
            <Link href="/admin/leaderboard" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
              Leaderboard →
            </Link>
          }
          padded={false}
        >
          <div style={{ padding: '0 18px 14px' }}>
            {top3.map((r, i) => (
              <div
                key={r.userId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 80px 60px',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 0',
                  borderTop: i ? '1px solid var(--divider)' : 'none',
                }}
              >
                <Medal rank={r.rank} size={32} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar name={r.name} initials={initialsFromName(r.name)} size={26} tone="lv-4" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{r.levelLabel}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }} className="num">
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{r.weekPoints}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 3 }}>pts</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <RankDelta delta={r.rankDelta ?? (r.lastWeekRank != null ? r.lastWeekRank - r.rank : undefined)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <Card title="Activity heatmap" subtitle="When the team is most active · sample data">
          <Heatmap
            data={ACTIVITY_HEATMAP}
            width={700}
            height={150}
            days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            hours={['8a–10a', '10a–12p', '12p–2p', '2p–4p', '4p–6p']}
          />
        </Card>

        <Card title="Day of week" subtitle={`Events logged · ${weekLabel}`}>
          <BarChart
            data={DOW_ACTIVITY}
            width={400}
            height={150}
            color="var(--lv2)"
            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
          />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <Card title="Top performers by category" subtitle="Who's strongest at what · sample data" padded={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--divider)' }}>
            {(
              [
                { key: 'calls' as const, label: 'Calls', unit: 'leads', icon: Icon.send },
                { key: 'meetings' as const, label: 'Meetings', unit: 'completed', icon: Icon.people },
                { key: 'pipeline' as const, label: 'Pipeline', unit: 'advances', icon: Icon.list },
                { key: 'wins' as const, label: 'Deals won', unit: 'closed', icon: Icon.trophy },
              ] as const
            ).map((cat, idx) => {
              const list = TOP_BY[cat.key]
              return (
                <div
                  key={cat.key}
                  style={{
                    padding: '14px 16px',
                    borderRight: idx < 3 ? '1px solid var(--divider)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
                    {cat.icon}
                    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                      {cat.label}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {list.map((entry, i) => {
                      const rep = DEMO_REPS_BY_ID[entry.id]
                      if (!rep) return null
                      return (
                        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="num" style={{ width: 12, fontSize: 10.5, color: 'var(--muted)', fontWeight: i === 0 ? 600 : 400 }}>
                            {i + 1}
                          </span>
                          <Avatar name={rep.name} initials={rep.initials} size={22} tone={rep.tone} />
                          <span style={{ flex: 1, fontSize: 11.5, fontWeight: i === 0 ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rep.name.split(' ')[0]}
                          </span>
                          <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>{entry.v}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Needs attention" subtitle="Reps to follow up with" padded={false}>
          <div style={{ padding: '4px 18px 14px' }}>
            {atRisk.map((r) => (
              <div
                key={r.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--divider)',
                }}
              >
                <Avatar name={r.name} initials={initialsFromName(r.name)} size={30} tone="lv-2" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--warn)' }}>{r.reason ?? 'Below threshold'}</div>
                </div>
                <NudgeButton onNudge={() => onNudge(r.name)} />
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--divider)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Streak at risk tonight</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name="Fiona Walsh" initials="FW" size={24} tone="lv-3" />
                <span style={{ fontSize: 12, flex: 1 }}>Fiona Walsh</span>
                <span style={{ color: 'var(--flame)', display: 'inline-flex' }}>{Icon.flame}</span>
                <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>
                  5
                </span>
                <NudgeButton onNudge={() => onNudge('Fiona Walsh')} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
