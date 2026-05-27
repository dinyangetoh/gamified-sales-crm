export default function StackedBar({
  segments,
  max,
  width = 100,
  height = 8,
}: {
  segments: { v: number; c: string }[]
  max?: number
  width?: number
  height?: number
}) {
  const total = segments.reduce((s, seg) => s + seg.v, 0)
  const m = max || total || 1
  let x = 0

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect width={width} height={height} rx="2" fill="var(--bg-sub)" />
      <g>
        {segments.map((seg, i) => {
          const w = (seg.v / m) * width
          const el = <rect key={i} x={x} y={0} width={w} height={height} fill={seg.c} />
          x += w
          return el
        })}
      </g>
    </svg>
  )
}
