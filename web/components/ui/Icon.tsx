import type { ReactNode } from 'react'

function ArrowIcon({ dir }: { dir: number }) {
  if (dir > 0) {
    return (
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 12V4M4 7l4-3 4 3" />
      </svg>
    )
  }
  if (dir < 0) {
    return (
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 4v8M4 9l4 3 4-3" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h8" />
    </svg>
  )
}

export const Icon = {
  dashboard: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" />
      <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h8v3a4 4 0 0 1-8 0V3z" />
      <path d="M4 4H2.5a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2H4M12 4h1.5a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H12" />
      <path d="M6 13h4M8 10v3" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="4" x2="13" y2="4" />
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="12" x2="13" y2="12" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M2 13.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" />
      <circle cx="11.5" cy="6" r="1.8" />
      <path d="M10.5 9.7c1.2.2 3.5 1 3.5 3.3" />
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2v12M3 5h7l1.5 2L10 9H3" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2.5 4l5.5 4.5L13.5 4" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1.5L3.5 9h4l-1 5.5L13 7H9l0-5.5z" strokeLinejoin="round" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
      <path d="M8 1.5s-1 2.4-3 4-2.5 3.2-2.5 5A5.5 5.5 0 0 0 8 16a5.5 5.5 0 0 0 5.5-5.5c0-2.5-1.5-3.6-2.5-5-.7-1-1-3-3-4z" />
    </svg>
  ),
  arrow: (dir: number) => <ArrowIcon dir={dir} />,
  chev: (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l2.5 2" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M4 8h8M6 12h4" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3H3v10h10V10M9 3h4v4M13 3L7 9" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2L2 7l5 2 2 5 5-12z" strokeLinejoin="round" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  ),
}

export function levelTone(level: number): string {
  return `lv-${Math.max(1, Math.min(4, level))}`
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}
