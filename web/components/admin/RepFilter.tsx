'use client'

import { Icon } from '@/components/ui/Icon'

export default function RepFilter() {
  return (
    <button
      type="button"
      className="btn ghost sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 28, padding: '0 10px', fontSize: 12 }}
    >
      {Icon.filter}
      <span>All reps</span>
    </button>
  )
}
