import type { CSSProperties, ReactNode } from 'react'

export default function Card({
  title,
  subtitle,
  action,
  padded = true,
  children = null,
  style,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  padded?: boolean
  children?: ReactNode
  style?: CSSProperties
}) {
  return (
    <section className="card" style={style}>
      {(title || subtitle || action) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px 12px',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && (
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>
                {title}
              </h3>
            )}
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding: padded ? '0 18px 16px' : 0 }}>{children}</div>
    </section>
  )
}

