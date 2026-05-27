import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

export default function EmailEndOfWeekPush({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="Last-chance push to win the week.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        End of week push
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {recipientName}, push to win this week.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You are close — log one more scored event and protect your rank.
      </p>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Open activity" secondary />
      </div>
    </EmailFrame>
  )
}

