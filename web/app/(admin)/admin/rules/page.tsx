'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import ActiveDot from '@/components/ui/ActiveDot'
import LevelChip from '@/components/ui/LevelChip'
import BadgeIcon from '@/components/ui/BadgeIcon'
import StackedBar from '@/components/charts/StackedBar'
import { Icon } from '@/components/ui/Icon'
import { apiFetch } from '@/lib/api/client'

type ManagerRulesResponse = {
  scoringRules: Array<{ eventType: string; eventTypeDisplayName: string; points: number; isActive: boolean; updatedAt: string }>
  dailyCapRules: Array<{ eventType: string; eventTypeDisplayName: string; maxCount: number; isActive: boolean; updatedAt: string }>
  levelConfig: Array<{ level: number; minXP: number; label: string }>
  badges: Array<{ type: string; displayName: string; description: string; iconUrl: string; targetCount: number; windowType: string }>
}

const LEVEL_SEGMENTS: Record<number, { v: number; c: string }[]> = {
  1: [{ v: 1, c: '#6c7280' }],
  2: [{ v: 3, c: '#4a63b8' }],
  3: [{ v: 3, c: '#7a4fbe' }],
  4: [{ v: 1, c: '#b88420' }],
}

export default function ManagerRulesPage() {
  const [data, setData] = useState<ManagerRulesResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<ManagerRulesResponse>('/admin/rules')
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load rules')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell
      role="manager"
      active="rules"
      title="Scoring rules"
      sub="Read-only view of the active gamification configuration"
      actions={
        <button type="button" className="btn sm" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          {Icon.lock}
          <span>Edit rules — coming in MVP</span>
        </button>
      }
    >
      {err && <Card title="Could not load" subtitle={err} />}
      {!err && !data && <Card title="Loading…" subtitle="Fetching manager rules"> </Card>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card title="Point values" subtitle="Awarded per scored event" padded={false}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 80px 80px 60px',
                  padding: '9px 18px',
                  borderTop: '1px solid var(--divider)',
                  borderBottom: '1px solid var(--divider)',
                  fontSize: 10.5,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <div>Event type</div>
                <div style={{ textAlign: 'right' }}>Points</div>
                <div style={{ textAlign: 'right' }}>Daily cap</div>
                <div style={{ textAlign: 'right' }}>Status</div>
              </div>
              {data.scoringRules.map((r) => {
                const cap = data.dailyCapRules.find((c) => c.eventType === r.eventType)
                return (
                  <div
                    key={r.eventType}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 80px 80px 60px',
                      padding: '12px 18px',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--divider)',
                    }}
                  >
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{r.eventTypeDisplayName}</div>
                    <div style={{ textAlign: 'right' }} className="num">
                      <span style={{ fontSize: 14, fontWeight: 600, color: r.points < 0 ? 'var(--danger)' : 'var(--ink)' }}>
                        {r.points > 0 ? '+' : ''}
                        {r.points}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }} className="num">
                      {cap?.maxCount ? <span>{cap.maxCount}/day</span> : <span style={{ color: 'var(--muted-2)' }}>—</span>}
                    </div>
                    <div style={{ textAlign: 'right' }}>{r.isActive ? <ActiveDot /> : <span style={{ color: 'var(--muted)' }}>—</span>}</div>
                  </div>
                )
              })}
            </Card>

            <Card title="Levels" subtitle="XP thresholds" padded={false}>
              {data.levelConfig
                .slice()
                .sort((a, b) => a.level - b.level)
                .map((l) => (
                  <div
                    key={l.level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: '1px solid var(--divider)',
                    }}
                  >
                    <LevelChip level={l.level} label={l.label} size="sm" />
                    <div style={{ flex: 1 }}>
                      <StackedBar segments={LEVEL_SEGMENTS[l.level] ?? [{ v: 1, c: '#6c7280' }]} width={120} />
                    </div>
                    <span className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {l.minXP} XP
                    </span>
                  </div>
                ))}
            </Card>
          </div>

          <Card title="Badge definitions" subtitle="Used by scoring and notifications">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {data.badges.map((b) => (
                <div key={b.type} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BadgeIcon type={b.type} size={42} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{b.displayName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {b.targetCount} · {b.windowType}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{b.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </AppShell>
  )
}
