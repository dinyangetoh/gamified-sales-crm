export default function EventStatusChip({ dup, capped }: { dup?: boolean; capped?: boolean }) {
  if (!dup && !capped) return null
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {dup && (
        <span className="chip" style={{ height: 18, padding: '0 6px', fontSize: 10, background: 'var(--warn-soft)', color: 'var(--warn)' }}>
          dup
        </span>
      )}
      {capped && (
        <span className="chip" style={{ height: 18, padding: '0 6px', fontSize: 10, background: 'var(--bg-sub)', color: 'var(--muted)' }}>
          capped
        </span>
      )}
    </span>
  )
}
