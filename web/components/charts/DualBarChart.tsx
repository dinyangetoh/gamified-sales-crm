export default function DualBarChart({
  thisWeek,
  lastWeek,
  labels,
  width = 520,
  height = 160,
  colorA = 'var(--lv4)',
  colorB = 'var(--muted-2)',
}: {
  thisWeek: number[]
  lastWeek: number[]
  labels: string[]
  width?: number
  height?: number
  colorA?: string
  colorB?: string
}) {
  const max = Math.max(...thisWeek, ...lastWeek, 1)
  const pad = { l: 30, r: 8, t: 10, b: 22 }
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const groupW = W / thisWeek.length

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
      <line x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} stroke="var(--divider)" />
      {[max, max * 0.66, max * 0.33, 0].map((t, i) => {
        const y = pad.t + H - (t / max) * H
        return (
          <g key={i}>
            {i > 0 && i < 3 && (
              <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" strokeDasharray="2,3" />
            )}
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9.5" fill="var(--muted-2)" className="num">
              {Math.round(t)}
            </text>
          </g>
        )
      })}
      {thisWeek.map((v, i) => {
        const cx = pad.l + i * groupW + groupW / 2
        const barW = (groupW - 6) / 2
        const h1 = (v / max) * H
        const h2 = (lastWeek[i] / max) * H
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={pad.t + H - h2} width={barW} height={h2} fill={colorB} opacity="0.55" rx="2" />
            <rect x={cx + 1} y={pad.t + H - h1} width={barW} height={h1} fill={colorA} rx="2" />
            <text x={cx} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
