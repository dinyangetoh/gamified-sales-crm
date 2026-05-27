export default function Progress({
  value,
  max = 100,
  tone = 'ink',
  height = 6,
}: {
  value: number
  max?: number
  tone?: string
  height?: number
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const fill: Record<string, string> = {
    ink: 'var(--ink)',
    flame: 'var(--flame)',
    success: 'var(--success)',
    'lv-3': 'var(--lv3)',
    'lv-4': 'var(--lv4)',
    'lv-2': 'var(--lv2)',
  }

  return (
    <div className="bar" style={{ height, position: 'relative', background: 'var(--bg-sub)', borderRadius: 999, overflow: 'hidden' }}>
      <i
        style={{
          position: 'absolute',
          inset: 0,
          right: `${100 - pct}%`,
          background: fill[tone] || 'var(--ink)',
          borderRadius: 999,
        }}
      />
    </div>
  )
}
