import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

export default function EmailWeeklyRepDigest({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="Week recap: highlights and next steps.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Weekly recap
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {recipientName}, here&apos;s your week on Rally.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You kept your momentum and moved up the board. Next week, aim for one more streak day and one more stage advance.
      </p>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Top action</div>
          <div style={{ marginTop: 6, fontWeight: 900 }}>Stage advances</div>
        </div>
        <div style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Streak</div>
          <div style={{ marginTop: 6, fontWeight: 900 }}>Keep the chain alive</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="View leaderboard" />
      </div>
    </EmailFrame>
  )
}

