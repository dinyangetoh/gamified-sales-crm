export default function ActiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)' }} />
      Active
    </span>
  )
}
