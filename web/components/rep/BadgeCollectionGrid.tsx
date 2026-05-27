import Card from '@/components/ui/Card'
import BadgeIcon from '@/components/ui/BadgeIcon'
import SegmentBar from '@/components/charts/SegmentBar'
import { getBadgeDef } from '@/lib/design/badgeDefs'

export default function BadgeCollectionGrid({
  earned,
  inProgress,
}: {
  earned: Array<{ type: string; displayName?: string; awardCount?: number; awardedAt?: string }>
  inProgress: Array<{ type: string; displayName?: string; currentCount?: number; targetCount?: number }>
}) {
  const lockedCount = 0
  const totalAwards = earned.reduce((sum, b) => sum + (b.awardCount ?? 1), 0)
  const subtitle = `${earned.length} earned · ${inProgress.length} in progress · ${lockedCount} locked${totalAwards > earned.length ? ` · ${totalAwards} awards` : ''}`

  return (
    <Card title="Badge collection" subtitle={subtitle} style={{ marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        {earned.map((b) => {
          const def = getBadgeDef(b.type)
          const label = b.displayName ?? def?.name ?? b.type
          const title = (b.awardCount ?? 1) > 1 ? `${b.awardCount}x ${label}` : label
          return (
            <div
              key={`earned-${b.type}`}
              style={{
                padding: '14px 12px',
                textAlign: 'center',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            >
              <BadgeIcon type={b.type} size={42} />
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{title}</div>
              {b.awardedAt && (
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
                  Earned {new Date(b.awardedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          )
        })}
        {inProgress.map((p) => {
          const def = getBadgeDef(p.type)
          const label = p.displayName ?? def?.name ?? p.type
          const current = p.currentCount ?? 0
          const target = p.targetCount ?? 1
          return (
            <div
              key={`progress-${p.type}-${current}-${target}`}
              style={{
                padding: '14px 12px',
                textAlign: 'center',
                background: 'var(--surface)',
                border: '1px dashed var(--border-strong)',
                borderRadius: 10,
              }}
            >
              <BadgeIcon type={p.type} size={42} dimmed />
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8 }}>{label}</div>
              <div style={{ marginTop: 6 }}>
                <SegmentBar filled={current} total={target} color="var(--lv2)" height={5} />
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 5 }} className="num">
                {current} / {target}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
