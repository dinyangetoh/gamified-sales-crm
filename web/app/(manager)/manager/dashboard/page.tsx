'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { apiFetch } from '@/lib/api/client'
import BadgeIcon from '@/components/ui/BadgeIcon'
import { emailTemplateComponents, type EmailTemplateId } from '@/components/emails/emailTemplateRegistry'

type ManagerOverviewResponse = {
  top3?: Array<{ userId: string; name: string; weekPoints?: number; rank: number; levelLabel?: string; currentStreak?: number; badges?: Array<{ type: string; displayName: string; iconUrl: string }> }>
  atRisk?: Array<{ userId: string; name: string; reason?: string }>
  kpis?: Record<string, unknown>
  dlq?: Record<string, unknown>
}

type EmailTemplateRegistryItem = {
  templateId: string
  role: 'rep' | 'manager'
  status: 'poc' | 'mvp'
  trigger: string
  defaultSubject: string
  resendLink?: string
}

export default function ManagerDashboardPage() {
  const [overview, setOverview] = useState<ManagerOverviewResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [templates, setTemplates] = useState<EmailTemplateRegistryItem[] | null>(null)
  const [templatesErr, setTemplatesErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<ManagerOverviewResponse>('/manager/overview')
        if (cancelled) return
        setOverview(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load overview')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadTemplates() {
      setTemplatesErr(null)
      try {
        const res = await apiFetch<EmailTemplateRegistryItem[]>('/manager/emails/templates')
        if (cancelled) return
        setTemplates(res)
      } catch (e) {
        if (cancelled) return
        setTemplatesErr(e instanceof Error ? e.message : 'Failed to load templates')
      }
    }
    loadTemplates()
    return () => {
      cancelled = true
    }
  }, [])

  const featured = templates
    ? {
        poc: templates.find((t) => t.status === 'poc'),
        mvp: templates.find((t) => t.status === 'mvp'),
      }
    : { poc: undefined, mvp: undefined }

  return (
    <AppShell role="manager" active="dashboard" title="Overview" sub="Team health, top performers, and at-risk reps">
      {err && (
        <Card title="Could not load overview" subtitle={err}>
          The backend `/manager/overview` endpoint is not available yet.
        </Card>
      )}

      {!err && !overview && <Card title="Loading…" subtitle="Fetching team overview"> </Card>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card
          title="Top performers"
          subtitle="Top 3 reps (driven by weekly leaderboard + server-side aggregates)"
        >
          {overview?.top3?.length ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {overview.top3.map((r) => (
                <div
                  key={r.userId}
                  style={{
                    flex: '1 1 220px',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 12,
                    background: 'var(--surface-2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--muted)' }}>
                      #{r.rank}
                    </div>
                    <div style={{ fontWeight: 900 }}>{r.levelLabel ?? '—'}</div>
                  </div>
                  <div style={{ marginTop: 6, fontWeight: 900 }}>{r.name}</div>
                  <div style={{ marginTop: 4, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {r.weekPoints !== undefined ? `${r.weekPoints} pts` : '—'} · streak {r.currentStreak ?? '—'}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(r.badges ?? []).slice(0, 3).map((b) => (
                      <BadgeIcon key={b.type} type={b.type} size={30} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)' }}>No top performers yet.</div>
          )}
        </Card>

        <Card title="Transactional emails" subtitle="In-app demo strip">
          {templatesErr && <div style={{ color: 'var(--muted)' }}>Templates not available: {templatesErr}</div>}
          {!templatesErr && (!featured.poc && !featured.mvp) && <div style={{ color: 'var(--muted)' }}>No templates available.</div>}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
            {[featured.poc, featured.mvp].filter(Boolean).map((t) => (
              <div
                key={t!.templateId}
                style={{
                  flex: '1 1 240px',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 12,
                  background: 'var(--surface-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t!.templateId}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 12 }}>{t!.status.toUpperCase()}</div>
                </div>
                <div style={{ marginTop: 6, color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Trigger: {t!.trigger}</div>

                <div
                  style={{
                    marginTop: 10,
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#e9e5da',
                    height: 170,
                  }}
                >
                  {(() => {
                    const id = t!.templateId as EmailTemplateId
                    const Comp = emailTemplateComponents[id]
                    const recipientName = t!.role === 'manager' ? 'Morgan Vale' : 'Alice Smith'
                    return (
                      <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: 560 }}>
                        <Comp recipientName={recipientName} />
                      </div>
                    )
                  })()}
                </div>

                <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 800, color: 'var(--ink)' }}>{t!.defaultSubject}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <Button variant="solid" size="sm" onClick={() => (window.location.href = '/manager/emails')}>
              View all templates
            </Button>
          </div>
        </Card>

        {overview?.atRisk?.length ? (
          <Card title="At-risk reps" subtitle="Rule-based candidates (server-side)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overview.atRisk.map((r) => (
                <div key={r.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
                  <div style={{ fontWeight: 900 }}>{r.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 12 }}>{r.reason ?? '—'}</div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  )
}


