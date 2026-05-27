export default function DualMetricChart({
  primary,
  secondary,
  labels,
  width = 1380,
  height = 180,
}: {
  primary: number[]
  secondary: number[]
  labels: string[]
  width?: number
  height?: number
}) {
  const max1 = Math.max(...primary, 1)
  const max2 = Math.max(...secondary, 1)
  const pad = { l: 40, r: 40, t: 14, b: 24 }
  const W = width - pad.l - pad.r
  const H = height - pad.t - pad.b
  const stepX = primary.length > 1 ? W / (primary.length - 1) : W
  const pts = primary.map((v, i) => [pad.l + i * stepX, pad.t + H - (v / max1) * H])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
  const area = `${d} L${pad.l + W},${pad.t + H} L${pad.l},${pad.t + H} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: '100%' }}>
      {[max1, max1 * 0.66, max1 * 0.33, 0].map((t, i) => {
        const y = pad.t + H - (t / max1) * H
        return (
          <g key={i}>
            {i > 0 && i < 3 && (
              <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" strokeDasharray="2,3" />
            )}
            {i === 3 && <line x1={pad.l} x2={pad.l + W} y1={y} y2={y} stroke="var(--divider)" />}
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--muted-2)" className="num">
              {Math.round(t)}
            </text>
          </g>
        )
      })}
      {secondary.map((v, i) => {
        const h = (v / max2) * H
        const barW = stepX * 0.22
        const x = pad.l + i * stepX - barW / 2
        return <rect key={i} x={x} y={pad.t + H - h} width={barW} height={h} fill="var(--lv2)" opacity="0.3" rx="2" />
      })}
      {[max2, max2 * 0.66, max2 * 0.33].map((t, i) => {
        const y = pad.t + H - (t / max2) * H
        return (
          <text
            key={i}
            x={pad.l + W + 6}
            y={y + 3}
            textAnchor="start"
            fontSize="10"
            fill="var(--lv2)"
            className="num"
            opacity="0.75"
          >
            {Math.round(t)}
          </text>
        )
      })}
      <path d={area} fill="var(--lv4-soft)" opacity="0.65" />
      <path d={d} fill="none" stroke="var(--lv4)" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--surface)" stroke="var(--lv4)" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text
          key={i}
          x={pad.l + i * stepX}
          y={height - 6}
          textAnchor="middle"
          fontSize="10"
          fill="var(--muted)"
          className="num"
        >
          {l}
        </text>
      ))}
    </svg>
  )
}
