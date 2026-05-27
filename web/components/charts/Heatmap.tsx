export default function Heatmap({
  data,
  width = 540,
  height = 130,
  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  hours,
}: {
  data: number[][]
  width?: number
  height?: number
  days?: string[]
  hours?: string[]
}) {
  const cols = data[0]?.length ?? 0
  const rows = data.length
  const pad = { l: 20, t: 8, r: 0, b: 18 }
  const cellW = (width - pad.l - pad.r) / cols
  const cellH = (height - pad.t - pad.b) / rows
  const max = Math.max(...data.flat(), 1)

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
      {data.map((row, y) =>
        row.map((v, x) => {
          const opacity = v === 0 ? 0.08 : 0.18 + (v / max) * 0.82
          return (
            <rect
              key={`${y}-${x}`}
              x={pad.l + x * cellW + 1}
              y={pad.t + y * cellH + 1}
              width={cellW - 2}
              height={cellH - 2}
              rx="2"
              fill="var(--ink)"
              fillOpacity={opacity}
            />
          )
        }),
      )}
      {days.map((d, i) => (
        <text
          key={i}
          x={pad.l - 6}
          y={pad.t + i * cellH + cellH / 2 + 3}
          textAnchor="end"
          fontSize="9.5"
          fill="var(--muted)"
        >
          {d}
        </text>
      ))}
      {hours?.map((h, i) => (
        <text
          key={i}
          x={pad.l + i * cellW + cellW / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted-2)"
          className="num"
        >
          {h}
        </text>
      ))}
    </svg>
  )
}
