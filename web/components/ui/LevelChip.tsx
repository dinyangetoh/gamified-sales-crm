export default function LevelChip({
  level,
  label,
  size = 'md',
}: {
  level: number
  label: string
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? '0 7px' : '0 9px'
  const height = size === 'sm' ? 18 : 22
  const fontSize = size === 'sm' ? 10 : 11

  const lv = Math.max(1, Math.min(4, level))
  const colorVar = `var(--lv${lv})`
  const bgVar = `var(--lv${lv}-soft)`

  return (
    <span
      className="chip"
      style={{
        padding: pad,
        height,
        fontSize,
        background: bgVar,
        color: colorVar,
        fontWeight: 700,
        letterSpacing: '-0.005em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7, fontWeight: 800 }}>{`L${level}`}</span>
      <span style={{ fontWeight: 650 }}>{label}</span>
    </span>
  )
}

