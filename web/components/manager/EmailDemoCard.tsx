'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { emailTemplateComponents, type EmailTemplateId } from '@/components/emails/emailTemplateRegistry'
import { formatDisplayLabel } from '@/lib/labels/formatDisplayLabel'

type TemplateItem = {
  templateId: string
  templateDisplayName?: string
  role: 'rep' | 'manager'
  status: 'poc' | 'mvp'
  trigger: string
  defaultSubject: string
}

export default function EmailDemoCard({ templates }: { templates: TemplateItem[] | null }) {
  const poc = templates?.find((t) => t.templateId === 'BADGE_UNLOCK') ?? templates?.find((t) => t.status === 'poc')
  const mgr =
    templates?.find((t) => t.templateId === 'WEEKLY_MGR_DIGEST') ?? templates?.find((t) => t.status === 'mvp' && t.role === 'manager')

  const featured = [poc, mgr].filter(Boolean) as TemplateItem[]
  const pocCount = templates?.filter((t) => t.status === 'poc').length ?? 2
  const mvpCount = templates?.filter((t) => t.status === 'mvp').length ?? 7

  return (
    <Card title="Transactional emails" subtitle="In-app demo strip">
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 }}>
        <span className="num" style={{ color: 'var(--success)', fontWeight: 600 }}>
          {pocCount} live in POC
        </span>
        {' · '}
        <span>{mvpCount} scaffolded for MVP</span>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {featured.map((t) => {
          const id = t.templateId as EmailTemplateId
          const Comp = emailTemplateComponents[id]
          const recipientName = t.role === 'manager' ? 'Morgan Vale' : 'Alice Smith'
          return (
            <div
              key={t.templateId}
              style={{
                flex: '1 1 240px',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 12,
                background: 'var(--surface-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{t.templateDisplayName ?? formatDisplayLabel(t.templateId)}</div>
                <div className="num" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t.status.toUpperCase()}
                </div>
              </div>
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
                {Comp && (
                  <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: 560 }}>
                    <Comp recipientName={recipientName} />
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{t.defaultSubject}</div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <Button variant="solid" size="sm" onClick={() => (window.location.href = '/manager/emails')}>
          View all templates
        </Button>
      </div>
    </Card>
  )
}
