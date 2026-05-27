import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'

const DAYS = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue']

export default function EmailStreakRisk({
  recipientName = 'Alice Smith',
  streak = 5,
}: {
  recipientName?: string
  streak?: number
}) {
  return (
    <EmailFrame preheader={`Your ${streak}-day streak is at risk.`}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--warn-soft)',
          color: 'var(--warn)',
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          marginTop: 6,
        }}
      >
        Streak at risk
      </div>

      <h1 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Don&apos;t lose your {streak}-day streak.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You haven&apos;t logged a scored event today. Log one before midnight to keep your streak alive.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: '18px 22px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 700 }}>Last 7 days</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {DAYS.map((d, i) => {
            const active = i < streak
            const today = i === 6
            return (
              <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 28,
                    borderRadius: 6,
                    background: active ? 'var(--flame)' : today ? '#fff' : 'var(--bg-sub)',
                    border: today ? '1.5px dashed var(--warn)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: active ? '#fff' : 'var(--muted)',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}
                >
                  {active ? '•' : today ? '!' : ' '}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{d}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Log an activity" />
      </div>
    </EmailFrame>
  )
}

