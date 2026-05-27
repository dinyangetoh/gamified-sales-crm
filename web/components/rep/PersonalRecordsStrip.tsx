import Card from '@/components/ui/Card'
import { MY_RECORDS } from '@/lib/design/repDemo'

export default function PersonalRecordsStrip({ weekPoints }: { weekPoints: number }) {
  const records = [
    { label: 'Best week', ...MY_RECORDS.bestWeek, value: weekPoints, unit: 'pts', tone: 'lv-4' as const },
    { label: 'Best day', ...MY_RECORDS.bestDay, unit: 'pts', tone: 'lv-4' as const },
    { label: 'Longest streak', ...MY_RECORDS.longestStreak, unit: 'days', tone: 'flame' as const },
    { label: 'Deals won', ...MY_RECORDS.totalDeals, unit: 'lifetime', tone: 'success' as const },
    { label: 'Events logged', ...MY_RECORDS.totalEvents, unit: 'lifetime', tone: '' as const },
    { label: 'Win rate', ...MY_RECORDS.winRate, unit: '%', tone: 'success' as const },
  ]

  return (
    <Card title="Personal records" subtitle="The bar to clear" style={{ marginBottom: 14 }} padded={false}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderTop: '1px solid var(--divider)' }}>
        {records.map((s, i) => {
          const color =
            s.tone === 'flame' ? 'var(--flame)' : s.tone === 'success' ? 'var(--success)' : s.tone === 'lv-4' ? 'var(--lv4)' : 'var(--ink)'
          return (
            <div
              key={s.label}
              style={{
                padding: '14px 18px',
                borderRight: i < 5 ? '1px solid var(--divider)' : 'none',
              }}
            >
              <div style={{ fontSize: 10.5, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color }}>
                  {s.value}
                  {s.unit === '%' ? '%' : ''}
                </span>
                {s.unit !== '%' && <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{s.unit}</span>}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{s.when}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
