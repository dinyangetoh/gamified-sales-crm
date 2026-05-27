'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import { apiFetch } from '@/lib/api/client'
import BadgeIcon from '@/components/ui/BadgeIcon'

type ManagerRulesResponse = {
  scoringRules: Array<{ eventType: string; points: number; isActive: boolean; updatedAt: string }>
  dailyCapRules: Array<{ eventType: string; maxCount: number; isActive: boolean; updatedAt: string }>
  levelConfig: Array<{ level: number; minXP: number; label: string }>
  badges: Array<{ type: string; displayName: string; description: string; iconUrl: string; targetCount: number; windowType: string }>
}

export default function ManagerRulesPage() {
  const [data, setData] = useState<ManagerRulesResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<ManagerRulesResponse>('/manager/rules')
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
    <AppShell role="manager" active="rules" title="Rules" sub="Scoring, caps, levels, and badge definitions">
      {err && (
        <Card title="Could not load" subtitle={err}>
          Please try reloading the page.
        </Card>
      )}

      {!err && !data && <Card title="Loading…" subtitle="Fetching manager rules"> </Card>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card title="Scoring rules" subtitle="Points per event type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.scoringRules.map((r) => (
                <div
                  key={r.eventType}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: r.isActive ? 'var(--surface)' : 'var(--bg-sub)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{r.eventType}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      Updated {new Date(r.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900 }}>
                    {r.isActive ? '+' : '0'}{r.points}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Daily caps" subtitle="Per-event max counts (per rep/day)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.dailyCapRules.map((r) => (
                <div
                  key={r.eventType}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: r.isActive ? 'var(--surface)' : 'var(--bg-sub)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{r.eventType}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      Max {r.maxCount} · {r.isActive ? 'Active' : 'Disabled'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900 }}>{r.isActive ? r.maxCount : '—'}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Levels" subtitle="XP thresholds and labels">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.levelConfig
                .slice()
                .sort((a, b) => a.minXP - b.minXP)
                .map((l) => (
                  <div
                    key={l.level}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 900 }}>{l.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        Level {l.level} · minXP {l.minXP}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', fontWeight: 900 }}>
                      L{l.level}
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Badges" subtitle="Badge definitions used by scoring">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {data.badges.map((b) => (
                <div key={b.type} style={{ width: 210 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BadgeIcon type={b.type} size={46} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{b.displayName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        target {b.targetCount} · {b.windowType}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--muted)' }}>{b.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  )
}


