export type DonutSegment = { label: string; value: number; color: string }

export default function Donut({
  data,
  size = 140,
  thickness = 18,
  centerLabel,
  centerSub,
  gap = 2,
}: {
  data: DonutSegment[]
  size?: number
  thickness?: number
  centerLabel?: string | number
  centerSub?: string
  gap?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  let off = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-sub)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.value / total) * circ - gap
        const seg = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, len)} ${circ - len}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )
        off += len + gap
        return seg
      })}
      {centerLabel !== undefined && (
        <g>
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            fontSize={size * 0.18}
            fontWeight="600"
            fill="var(--ink)"
            className="num"
            letterSpacing="-0.03em"
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {centerSub}
            </text>
          )}
        </g>
      )}
    </svg>
  )
}
