export default function Sparkline({
  data,
  width = 100,
  height = 28,
  color = 'currentColor',
  fill,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: string
}) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const stepX = width / (data.length - 1 || 1)
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {fill && <path d={area} fill={fill} opacity="0.5" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  )
}
