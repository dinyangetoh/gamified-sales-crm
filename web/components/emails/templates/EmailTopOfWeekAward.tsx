import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

export default function EmailTopOfWeekAward({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="You won the week.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Top of the week
      </div>
      <h1 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Congrats, {recipientName}!
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You finished #1 on the leaderboard at the end of the week. Keep going — the next week is waiting.
      </p>

      <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>What’s next</div>
        <div style={{ marginTop: 6, fontWeight: 900 }}>Log activity daily to protect your momentum.</div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Open dashboard" />
      </div>
    </EmailFrame>
  )
}

