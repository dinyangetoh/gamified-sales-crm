import Card from '@/components/ui/Card'
import BadgeIcon from '@/components/ui/BadgeIcon'
import SegmentBar from '@/components/charts/SegmentBar'
import { getBadgeDef } from '@/lib/design/badgeDefs'
import { Icon } from '@/components/ui/Icon'

export default function BadgeProgressCard({
  type,
  current,
  target,
}: {
  type: string
  current: number
  target: number
}) {
  const def = getBadgeDef(type)
  if (!def) return null

  return (
    <Card title="Up next" subtitle="The closest badge in reach" padded={false}>
      <div style={{ padding: '4px 18px 18px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <BadgeIcon type={type} size={56} dimmed />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{def.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>{def.desc}</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Progress this week</span>
            <span className="num" style={{ fontSize: 12, fontWeight: 600 }}>
              {current} / {target}
            </span>
          </div>
          <SegmentBar filled={current} total={target} color="var(--lv2)" height={10} />
        </div>
        <div
          style={{
            marginTop: 14,
            padding: '12px 14px',
            background: 'var(--bg-sub)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--ink-2)',
          }}
        >
          Advance <strong className="num">{target - current}</strong> more before Sunday 23:59 to unlock.
        </div>
        <button
          type="button"
          className="btn"
          style={{ width: '100%', marginTop: 12, justifyContent: 'center', height: 34, display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          {Icon.bolt}
          <span>Log a stage advance</span>
        </button>
      </div>
    </Card>
  )
}
