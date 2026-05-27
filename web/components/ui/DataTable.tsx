import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  gridTemplateColumns,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  gridTemplateColumns: string
}) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          padding: '10px 18px',
          borderBottom: '1px solid var(--divider)',
          fontSize: 10.5,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
        }}
      >
        {columns.map((c) => (
          <div key={c.key} style={{ textAlign: c.align ?? 'left' }}>
            {c.header}
          </div>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          style={{
            display: 'grid',
            gridTemplateColumns,
            padding: '12px 18px',
            alignItems: 'center',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          {columns.map((c) => (
            <div key={c.key} style={{ textAlign: c.align ?? 'left', minWidth: 0 }}>
              {c.render(row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
