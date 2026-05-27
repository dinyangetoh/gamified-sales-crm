export default function BadgeIcon({
  type,
  size = 36,
  locked,
}: {
  type: string
  size?: number
  locked?: boolean
}) {
  const glyph = type?.slice(0, 1) ?? '?'

  return (
    <span
      title={type}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-sub)',
        border: '1px solid var(--border)',
        color: 'var(--ink-2)',
        opacity: locked ? 0.45 : 1,
        filter: locked ? 'grayscale(1)' : undefined,
        fontFamily: 'var(--font-mono)',
        fontWeight: 800,
        fontSize: Math.max(12, size * 0.35),
      }}
    >
      {glyph}
    </span>
  )
}

