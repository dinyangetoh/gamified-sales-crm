'use client'

import { useMemo } from 'react'
import type { EmailTemplateId } from './emailTemplateRegistry'
import { emailTemplateComponents } from './emailTemplateRegistry'

type TemplateRegistryItem = {
  templateId: EmailTemplateId
  role: 'rep' | 'manager'
  status: 'poc' | 'mvp'
  trigger: string
  defaultSubject: string
  resendLink?: string
}

export default function EmailPreviewPage({
  templates,
  selectedTemplateId,
  onSelectTemplateId,
  toEmail,
  onToEmailChange,
  onSendTest,
  sending,
  message,
}: {
  templates: TemplateRegistryItem[]
  selectedTemplateId: EmailTemplateId
  onSelectTemplateId: (id: EmailTemplateId) => void
  toEmail: string
  onToEmailChange: (email: string) => void
  onSendTest: (templateId: EmailTemplateId) => void
  sending: boolean
  message: string | null
}) {
  const selected = useMemo(
    () => templates.find((t) => t.templateId === selectedTemplateId) ?? templates[0],
    [templates, selectedTemplateId],
  )

  const Comp = selected ? emailTemplateComponents[selected.templateId] : null

  const recipientName = selected?.role === 'manager' ? 'Morgan Vale' : 'Alice Smith'

  const order = useMemo(
    () => [
      'BADGE_UNLOCK',
      'LEVEL_UP',
      'NEAR_BADGE',
      'STREAK_RISK',
      'STREAK_BROKEN',
      'WEEKLY_REP_DIGEST',
      'END_OF_WEEK_PUSH',
      'TOP_OF_WEEK_AWARD',
      'WEEKLY_MGR_DIGEST',
    ] as EmailTemplateId[],
    [],
  )

  const selectedForPicker = selected?.templateId ?? selectedTemplateId

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, height: '100%' }}>
      {/* Picker */}
      <div className="card" style={{ padding: '10px', alignSelf: 'start', position: 'sticky', top: 0 }}>
        <div
          style={{
            padding: '6px 8px 10px',
            fontSize: 11,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 500,
          }}
        >
          Sales Rep
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {order
            .filter((k) => templates.find((t) => t.templateId === k)?.role === 'rep')
            .map((k) => {
              const t = templates.find((x) => x.templateId === k)!
              const active = k === selectedForPicker
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSelectTemplateId(k)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 7,
                    background: active ? 'var(--bg-sub)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: t.status === 'poc' ? 'var(--success)' : 'var(--muted-2)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: 'var(--ink)' }}>{k}</div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.trigger}
                    </div>
                  </div>
                </button>
              )
            })}
        </div>

        <div
          style={{
            padding: '14px 8px 8px',
            fontSize: 11,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 500,
          }}
        >
          Manager
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {order
            .filter((k) => templates.find((t) => t.templateId === k)?.role === 'manager')
            .map((k) => {
              const t = templates.find((x) => x.templateId === k)!
              const active = k === selectedForPicker
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSelectTemplateId(k)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 7,
                    background: active ? 'var(--bg-sub)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: t.status === 'poc' ? 'var(--success)' : 'var(--muted-2)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: 'var(--ink)' }}>{k}</div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.trigger}
                    </div>
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* Preview pane */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Meta strip */}
        <div
          className="card"
          style={{
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr 80px',
            gap: 14,
            alignItems: 'center',
            border: 'none',
            borderRadius: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Template
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{selected?.templateId ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{selected?.templateId ?? ''}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Audience
            </div>
            <div style={{ fontSize: 12.5, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="chip" style={{ height: 22, background: selected?.role === 'manager' ? 'var(--lv3-soft)' : 'var(--lv4-soft)', color: selected?.role === 'manager' ? 'var(--lv3)' : 'var(--lv4)' }}>
                {selected?.role === 'manager' ? 'MANAGER' : 'SALES_REP'}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Trigger
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.4 }}>{selected?.trigger ?? '—'}</div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Channel
            </div>
            <div style={{ fontSize: 12, marginTop: 6, color: 'var(--ink-2)' }}>Email · Resend</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
              Status
            </div>
            <span
              className="chip"
              style={{
                marginTop: 5,
                background: selected?.status === 'poc' ? 'var(--success-soft)' : 'var(--bg-sub)',
                color: selected?.status === 'poc' ? 'var(--success)' : 'var(--muted)',
                fontWeight: 700,
              }}
            >
              {selected?.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Preview chrome */}
        <div
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid var(--divider)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 11.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>From</span>
            <span className="num">rally@acme-sales.com</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', flex: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>To</span>
            <input
              value={toEmail}
              onChange={(e) => onToEmailChange(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ink)',
                fontWeight: 700,
                maxWidth: 220,
              }}
            />
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', flex: 1 }}>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>Subject</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected?.defaultSubject ?? '—'}
            </span>
          </div>

          {/* Send button */}
          <button
            className="btn ghost sm"
            style={{ height: 28, padding: '0 10px', fontSize: 11, cursor: selected?.status === 'poc' ? 'pointer' : 'not-allowed' }}
            onClick={() => selected && onSendTest(selected.templateId)}
            disabled={sending || selected?.status !== 'poc'}
          >
            {sending ? 'Sending…' : 'Send test'}
          </button>
        </div>

        <div
          className="scroll"
          style={{
            flex: 1,
            minHeight: 0,
            background: '#e9e5da',
            padding: 0,
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {selected && Comp ? (
            <div style={{ padding: '0 0 28px' }}>
              <Comp recipientName={recipientName} />
            </div>
          ) : (
            <div style={{ padding: 18, color: 'var(--muted)' }}>No template selected.</div>
          )}
        </div>

        {message ? (
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--divider)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {message}
          </div>
        ) : null}
      </div>
    </div>
  )
}

