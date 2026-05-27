import Card from '@/components/ui/Card'
import BadgeIcon from '@/components/ui/BadgeIcon'
import Crown from '@/components/charts/Crown'
import { Icon } from '@/components/ui/Icon'

type TimelineItem = {
  id: string
  type: string
  badgeType?: string | null
  displayName?: string
  pointsSnapshot: number
  weekKey: string | null
  createdAt: string
  metadata: object | null
}

function noteForItem(t: TimelineItem): string {
  if (t.displayName) return t.displayName
  const meta = t.metadata as Record<string, unknown> | null
  if (t.type === 'LEVEL_UP' && meta?.from != null && meta?.to != null) return `Level ${meta.from} → ${meta.to}`
  if (t.type === 'STREAK_MILESTONE') return 'Streak milestone'
  if (t.type === 'WEEKLY_TOP_3') return 'Weekly top 3'
  return t.type.replace(/_/g, ' ').toLowerCase()
}

export default function AchievementsTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <Card title="Recent achievements" subtitle="Your story so far" padded={false}>
      <div style={{ padding: '0 18px 12px' }}>
        {items.slice(0, 6).map((t, i) => {
          const isBadge = t.type === 'BADGE_EARNED'
          const isLevel = t.type === 'LEVEL_UP'
          const isStreak = t.type === 'STREAK_MILESTONE'
          const isTop = t.type === 'WEEKLY_TOP_3'

          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 0',
                borderTop: i ? '1px solid var(--divider)' : 'none',
                alignItems: 'center',
              }}
            >
              <div style={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                {isBadge && t.badgeType && <BadgeIcon type={t.badgeType} size={28} />}
                {isLevel && (
                  <span className="shield lv-4" style={{ width: 28, height: 30, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    L
                  </span>
                )}
                {isStreak && <span style={{ color: 'var(--flame)', display: 'inline-flex' }}>{Icon.flame}</span>}
                {isTop && <Crown size={22} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>{noteForItem(t)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 1, display: 'flex', gap: 6 }}>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span className="num">{t.pointsSnapshot} XP</span>
                  {t.weekKey && (
                    <>
                      <span>·</span>
                      <span>{t.weekKey}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
