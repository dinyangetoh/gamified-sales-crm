export default function BarChart({
  data,
  width = 600,
  height = 160,
  max,
  color = 'var(--ink)',
  labels,
}: {
  data: number[]
  width?: number
  height?: number
  max?: number
  color?: string
  labels?: string[]
}) {
  const m = max || Math.max(...data, 1)
  const pad = { l: 30, r: 8, t: 10, b: 22 }
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const barW = W / data.length

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }}>
      <line x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} stroke="var(--divider)" />
      {[m, m / 2, 0].map((t, i) => {
        const y = pad.t + H - (t / m) * H
        return (
          <text key={i} x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill="var(--muted-2)" className="num">
            {Math.round(t)}
          </text>
        )
      })}
      {data.map((v, i) => {
        const h = (v / m) * H
        const x = pad.l + i * barW + barW * 0.18
        const w = barW * 0.64
        const y = pad.t + H - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill={color} rx="2" />
            {labels && (
              <text x={x + w / 2} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
