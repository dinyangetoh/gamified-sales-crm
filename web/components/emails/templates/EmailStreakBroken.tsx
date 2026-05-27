import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

export default function EmailStreakBroken({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="Your streak reset to 0.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Streak broken
      </div>
      <h1 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {recipientName}, your streak restarted.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        Log an activity today to rebuild momentum and get back to your next streak milestone.
      </p>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 900 }}>Next goal</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Get your first 2-day run
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Log activity" secondary />
      </div>
    </EmailFrame>
  )
}

