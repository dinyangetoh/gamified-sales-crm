export default function SegmentBar({
  filled,
  total,
  color = 'var(--ink)',
  height = 6,
  gap = 2,
}: {
  filled: number
  total: number
  color?: string
  height?: number
  gap?: number
}) {
  return (
    <div style={{ display: 'flex', gap, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height,
            borderRadius: 1,
            background: i < filled ? color : 'var(--bg-sub)',
          }}
        />
      ))}
    </div>
  )
}
