import EmailFrame from '../EmailFrame'
import EmailCTA from '../EmailCTA'
import BadgeIcon from '@/components/ui/BadgeIcon'
import LevelChip from '@/components/ui/LevelChip'

export default function EmailBadgeUnlock({
  recipientName = 'Alice Smith',
}: {
  recipientName?: string
}) {
  return (
    <EmailFrame preheader="You just earned the Consistent Closer badge.">
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        Badge unlocked
      </div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Nice work, {recipientName}.
      </h1>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        You closed your third deal this week — that&apos;s the <strong>Consistent Closer</strong> badge for Week 21.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: '20px 22px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <BadgeIcon type="CONSISTENT_CLOSER" size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Consistent Closer</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Close 3 deals in a single week.
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)' }}>
            <span>
              Earned <span className="num" style={{ color: 'var(--ink)' }}>May 26</span>
            </span>
            <span>
              At <LevelChip level={4} label="Legend" size="sm" />
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <EmailCTA label="See your badges" />
        <EmailCTA label="View leaderboard" secondary />
      </div>
    </EmailFrame>
  )
}

