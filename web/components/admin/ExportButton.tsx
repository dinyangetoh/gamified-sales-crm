'use client'

import { Icon } from '@/components/ui/Icon'

export type ExportRow = Record<string, string | number>

export default function ExportButton({
  filename,
  rows,
  onDone,
}: {
  filename: string
  rows: ExportRow[]
  onDone?: () => void
}) {
  function exportCsv() {
    if (!rows.length) return
    const keys = Object.keys(rows[0])
    const lines = [
      keys.join(','),
      ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onDone?.()
  }

  return (
    <button
      type="button"
      className="btn sm"
      onClick={exportCsv}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px', fontSize: 12 }}
    >
      {Icon.ext}
      <span>Export</span>
    </button>
  )
}
