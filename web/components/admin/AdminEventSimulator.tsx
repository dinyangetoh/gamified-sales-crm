'use client'

import { useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EventSimulatorResultModal from '@/components/admin/EventSimulatorResultModal'
import { apiFetch } from '@/lib/api/client'
import {
  type ProcessEventResult,
  type SimulatorEventType,
  type SimulatorModalState,
  newEventId,
} from '@/lib/events/eventSimulatorTypes'
import { useEventTypeOptions } from '@/lib/events/useEventTypeOptions'

type RepOption = { userId: string; name: string; email: string }

const fieldStyle: React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--ink-2)',
  fontWeight: 500,
  marginBottom: 5,
  display: 'block',
}

export default function AdminEventSimulator({ reps }: { reps: RepOption[] }) {
  const eventTypeOptions = useEventTypeOptions()
  const [userId, setUserId] = useState(reps[0]?.userId ?? '')
  const [eventType, setEventType] = useState<SimulatorEventType>('LEAD_CONTACTED')
  const [eventId, setEventId] = useState(() => newEventId())
  const [entityId, setEntityId] = useState('deal-123')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<SimulatorModalState | null>(null)

  const timestamp = useMemo(() => new Date().toISOString(), [loading])

  async function submit() {
    if (!userId) {
      setModal({ kind: 'error', message: 'Select a sales rep first.' })
      return
    }
    if (!eventId.trim()) {
      setModal({ kind: 'error', message: 'Event ID is required.' })
      return
    }
    if (!entityId.trim()) {
      setModal({ kind: 'error', message: 'Entity ID is required.' })
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch<ProcessEventResult>('/events', {
        method: 'POST',
        body: {
          eventId: eventId.trim(),
          userId,
          eventType,
          entityId: entityId.trim(),
          timestamp,
          metadata: {},
        },
      })
      setModal({ kind: 'success', result: res })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit event'
      setModal({ kind: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  function regenerateEventId() {
    setEventId(newEventId())
  }

  return (
    <>
      <Card title="Submit event" subtitle="POST /events — scores synchronously for the selected rep">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Sales rep</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={fieldStyle} disabled={!reps.length}>
              {reps.map((r) => (
                <option key={r.userId} value={r.userId}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Event type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as SimulatorEventType)}
              style={fieldStyle}
            >
              {eventTypeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Event ID</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
              <Button type="button" variant="ghost" size="sm" onClick={regenerateEventId} style={{ flexShrink: 0 }}>
                New UUID
              </Button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Entity ID</label>
            <input value={entityId} onChange={(e) => setEntityId(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button type="button" onClick={submit} disabled={loading || !reps.length}>
            {loading ? 'Submitting…' : 'Submit event'}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Timestamp: {timestamp}</span>
        </div>
      </Card>

      <EventSimulatorResultModal state={modal} onClose={() => setModal(null)} />
    </>
  )
}
