import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'
import LevelChip from '@/components/ui/LevelChip'

export default function EmailLevelUp({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="You leveled up to Legend.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Level up
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        You&apos;re now a Legend, {recipientName}.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You crossed <strong>500 XP</strong> — the threshold for Rally&apos;s top tier.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: '20px 22px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <LevelChip level={3} label="Elite" />
          <div style={{ color: 'var(--muted)' }}>→</div>
          <LevelChip level={4} label="Legend" />
        </div>
        <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          Badge window: ISO week
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <EmailCTA label="Open dashboard" />
      </div>
    </EmailFrame>
  )
}

