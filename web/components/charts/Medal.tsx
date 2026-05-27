export default function Medal({ rank, size = 44 }: { rank: number; size?: number }) {
  const palette =
    (
      {
        1: { bg: '#f4e7c8', border: '#b88420', ink: '#7a5a14' },
        2: { bg: '#e2e1dc', border: '#9c9890', ink: '#54514a' },
        3: { bg: '#ebd6c3', border: '#a86b3e', ink: '#6d3f1d' },
      } as Record<number, { bg: string; border: string; ink: string }>
    )[rank] || { bg: 'var(--bg-sub)', border: 'var(--border-strong)', ink: 'var(--ink-2)' }

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size * 1.1 }}>
      <svg width={size} height={size * 1.1} viewBox="0 0 44 48" style={{ position: 'absolute', inset: 0 }}>
        <path d="M22 2 L40 11 L40 33 L22 46 L4 33 L4 11 Z" fill={palette.bg} stroke={palette.border} strokeWidth="1.5" />
        <path
          d="M22 6 L36 13 L36 31 L22 42 L8 31 L8 13 Z"
          fill="none"
          stroke={palette.border}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      </svg>
      <span
        className="num"
        style={{
          position: 'relative',
          margin: 'auto',
          fontWeight: 700,
          color: palette.ink,
          fontSize: size * 0.42,
          letterSpacing: '-0.04em',
        }}
      >
        {rank}
      </span>
    </span>
  )
}
