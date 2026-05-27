'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import Button from '@/components/ui/Button'
import { type ProcessEventResult, type SimulatorEventType, newEventId } from '@/lib/events/eventSimulatorTypes'
import { useEventTypeOptions } from '@/lib/events/useEventTypeOptions'

export default function EventSimulator({
  userId,
  onSent,
}: {
  userId: string
  onSent?: (result: ProcessEventResult) => void
}) {
  const eventTypeOptions = useEventTypeOptions()
  const [eventType, setEventType] = useState<SimulatorEventType>('LEAD_CONTACTED')
  const [entityId, setEntityId] = useState('deal-123')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const nowIso = useMemo(() => new Date().toISOString(), [loading])

  async function submit() {
    setLoading(true)
    setMessage(null)
    try {
      const eventId = newEventId()
      const res = await apiFetch<ProcessEventResult>('/events', {
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
        onChange={(e) => setEventType(e.target.value as SimulatorEventType)}
        style={inputStyle}
      >
        {eventTypeOptions.map((t) => (
          <option key={t.value} value={t.value}>
            {t.displayName}
          </option>
        ))}
      </select>

      <input value={entityId} onChange={(e) => setEntityId(e.target.value)} style={{ ...inputStyle, width: 160 }} />

      <Button onClick={submit} disabled={loading} style={{ height: 34, justifyContent: 'center' }}>
        {loading ? 'Processing…' : 'Simulate event'}
      </Button>

      {message && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{message}</div>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 10,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  padding: '0 10px',
  fontSize: 13,
  color: 'var(--ink)',
}
