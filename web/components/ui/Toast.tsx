'use client'

export default function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        padding: '12px 16px',
        background: 'var(--ink)',
        color: 'var(--accent-fg)',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {message}
    </div>
  )
}
