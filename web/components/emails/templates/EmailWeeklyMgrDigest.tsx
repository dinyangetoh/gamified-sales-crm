import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

export default function EmailWeeklyMgrDigest({
  recipientName = 'Morgan Vale',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="Acme Sales · Weekly digest highlights.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Weekly digest
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {recipientName}, here&apos;s what moved this week.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        Your reps logged enough activity to earn badges, and the leaderboard shifted in the right direction.
      </p>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Top rep
          </div>
          <div style={{ marginTop: 6, fontWeight: 900 }}>Alice Smith</div>
        </div>
        <div style={{ flex: '1 1 220px', padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            At-risk
          </div>
          <div style={{ marginTop: 6, fontWeight: 900 }}>Rep streaks need a nudge</div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Open manager overview" />
      </div>
    </EmailFrame>
  )
}

