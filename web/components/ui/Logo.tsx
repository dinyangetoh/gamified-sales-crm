export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          background: 'var(--ink)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-fg)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 800,
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
        }}
      >
        R
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Rally</span>
    </span>
  )
}

