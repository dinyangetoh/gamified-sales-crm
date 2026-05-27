import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'
import BadgeIcon from '@/components/ui/BadgeIcon'

export default function EmailNearBadge({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="You&apos;re 80% of the way to Pipeline Builder.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Almost there
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        One more stage advance.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        Move one more deal forward this week and you&apos;ll earn <strong>Pipeline Builder</strong>.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: '20px 22px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'flex',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <BadgeIcon type="PIPELINE_BUILDER" size={48} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Pipeline Builder</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Advance 5 deals through stages in a week.</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Open pipeline" />
      </div>
    </EmailFrame>
  )
}

