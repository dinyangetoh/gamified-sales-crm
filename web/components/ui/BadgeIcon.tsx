import { getBadgeDef } from '@/lib/design/badgeDefs'

const tones: Record<string, [string, string]> = {
  success: ['#3a8f63', '#e1f0e6'],
  flame: ['#d96a37', '#fbe7d8'],
  'lv-2': ['#4a63b8', '#e0e4f3'],
  'lv-3': ['#7a4fbe', '#ece1f3'],
  'lv-4': ['#b88420', '#f4e7c8'],
}

export default function BadgeIcon({
  type,
  size = 36,
  locked,
  dimmed,
}: {
  type: string
  size?: number
  locked?: boolean
  dimmed?: boolean
}) {
  const def = getBadgeDef(type)
  if (!def) {
    return (
      <span
        title={type}
        style={{
          width: size,
          height: size * 1.1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: size * 0.3,
          color: 'var(--muted)',
        }}
      >
        ?
      </span>
    )
  }

  const [fg, bg] = tones[def.tone] || tones['lv-2']
  const dimStyle = locked ? { filter: 'grayscale(1)', opacity: 0.45 } : dimmed ? { opacity: 0.6 } : {}

  return (
    <span
      title={def.name}
      style={{
        width: size,
        height: size * 1.1,
        position: 'relative',
        display: 'inline-flex',
        ...dimStyle,
      }}
    >
      <svg width={size} height={size * 1.1} viewBox="0 0 36 40" style={{ position: 'absolute', inset: 0 }}>
        <path
          d="M18 1 L34 8 L34 24 Q34 30 18 39 Q2 30 2 24 L2 8 Z"
          fill={bg}
          stroke={fg}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      </svg>
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 'auto',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          color: fg,
          fontSize: size * 0.34,
          paddingBottom: size * 0.05,
          letterSpacing: '-0.05em',
        }}
      >
        {def.glyph}
      </span>
    </span>
  )
}
