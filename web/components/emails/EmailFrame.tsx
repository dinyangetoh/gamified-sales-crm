import type { ReactNode } from 'react'

export default function EmailFrame({
  preheader,
  children,
  footer,
}: {
  preheader: string
  children: ReactNode
  footer?: string
}) {
  return (
    <div
      className="email"
      style={{
        width: '100%',
        height: '100%',
        background: '#f1eee6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: 560, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', padding: '0 4px 10px' }}>{preheader}</div>

        <div
          style={{
            padding: '18px 28px',
            background: 'var(--surface)',
            borderRadius: '12px 12px 0 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: 'var(--ink)',
                color: 'var(--accent-fg)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '-0.04em',
              }}
            >
              R
            </span>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>Rally</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', padding: '24px 28px', flex: 1 }}>{children}</div>

        <div
          style={{
            background: 'var(--surface-2)',
            padding: '16px 28px',
            borderRadius: '0 0 12px 12px',
            borderTop: '1px solid var(--border)',
            fontSize: 10.5,
            color: 'var(--muted)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>{footer ?? "You're receiving this because you're a Rally user at Acme Sales Org."}</span>
          <span style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Manage notifications</span>
        </div>
      </div>
    </div>
  )
}

