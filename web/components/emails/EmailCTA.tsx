export default function EmailCTA({
  label,
  secondary,
}: {
  label: string
  secondary?: boolean
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 38,
        padding: '0 18px',
        background: secondary ? 'transparent' : 'var(--ink)',
        color: secondary ? 'var(--ink)' : 'var(--accent-fg)',
        border: secondary ? '1px solid var(--border-strong)' : '1px solid var(--ink)',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {label}
    </a>
  )
}

