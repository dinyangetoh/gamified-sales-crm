import { Icon } from '@/components/ui/Icon'

export default function OrgSwitcher() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        fontSize: 12,
        color: 'var(--ink-2)',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--success)' }} />
      <span style={{ flex: 1 }}>Acme Sales Org</span>
      <span style={{ color: 'var(--muted-2)', display: 'inline-flex' }}>{Icon.chev}</span>
    </div>
  )
}
