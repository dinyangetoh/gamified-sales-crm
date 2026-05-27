'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import Button from '@/components/ui/Button'

const eventTypes = [
  { value: 'LEAD_CONTACTED', label: 'Lead contacted' },
  { value: 'MEETING_COMPLETED', label: 'Meeting completed' },
  { value: 'STAGE_ADVANCED', label: 'Stage advanced' },
  { value: 'DEAL_WON', label: 'Deal won' },
  { value: 'DEAL_LOST', label: 'Deal lost' },
] as const

type EventResult = {
  eventId: string
  accepted: boolean
  duplicate: boolean
  capReached: boolean
  pointsAwarded: number
  reason?: string
  user?: { totalXP: number; totalPoints: number; level: number; levelLabel: string; currentStreak: number; longestStreak: number }
  badgesUnlocked: Array<{ type: string; displayName: string; iconUrl: string }>
}

export default function EventSimulator({
  userId,
  onSent,
}: {
  userId: string
  onSent?: (result: EventResult) => void
}) {
  const [eventType, setEventType] = useState<(typeof eventTypes)[number]['value']>('LEAD_CONTACTED')
  const [entityId, setEntityId] = useState('deal-123')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const nowIso = useMemo(() => new Date().toISOString(), [loading])

  async function submit() {
    setLoading(true)
    setMessage(null)
    try {
      const eventId = crypto.randomUUID()
      const res = await apiFetch<EventResult>('/events', {
        method: 'POST',
        body: {
          eventId,
          userId,
          eventType,
          entityId,
          timestamp: nowIso,
          metadata: {},
        },
      })

      if (res.duplicate) {
        setMessage(res.reason ?? 'Duplicate event ignored')
      } else if (res.accepted) {
        setMessage(res.capReached ? `Accepted (cap reached): 0 points` : `Accepted: +${res.pointsAwarded} points`)
      }

      onSent?.(res)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit event'
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value as (typeof eventTypes)[number]['value'])}
        style={{
          height: 34,
          borderRadius: 10,
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          padding: '0 10px',
          fontSize: 13,
          color: 'var(--ink)',
        }}
      >
        {eventTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <input
        value={entityId}
        onChange={(e) => setEntityId(e.target.value)}
        style={{
          height: 34,
          borderRadius: 10,
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          padding: '0 10px',
          fontSize: 13,
          color: 'var(--ink)',
          width: 160,
        }}
      />

      <Button onClick={submit} disabled={loading} style={{ height: 34, justifyContent: 'center' }}>
        {loading ? 'Processing…' : 'Simulate event'}
      </Button>

      {message && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{message}</div>}
    </div>
  )
}

