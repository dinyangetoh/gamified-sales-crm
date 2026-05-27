'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import Button from '@/components/ui/Button'

type EventFeedResponse = {
  events: Array<{
    eventId: string
    userId: string
    provider: string
    eventType: string
    entityId: string
    pointsAwarded: number
    capReached: boolean
    timestamp: string
    createdAt: string
  }>
  total: number
  limit: number
  offset: number
}

function toIsoOrUndefined(value: string) {
  if (!value) return undefined
  // `value` is from <input type="date"> => YYYY-MM-DD
  // Interpret as UTC start of day to be consistent with backend `new Date()`.
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

export default function ActivityPage() {
  const { session } = useSession()
  const userId = session?.sub

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [data, setData] = useState<EventFeedResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const query = useMemo(() => {
    const fromIso = toIsoOrUndefined(from)
    const toIso = toIsoOrUndefined(to)
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    if (fromIso) params.set('from', fromIso)
    if (toIso) params.set('to', toIso)
    return params.toString()
  }, [from, limit, offset, to])

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<EventFeedResponse>(`/users/${userId}/events?${query}`)
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load activity')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [query, userId])

  return (
    <AppShell role="rep" active="activity" title="Activity" sub="Event audit log">
      <Card
        title="Filter"
        subtitle="Optional from/to range. Pagination is server-backed."
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setOffset(0)
                setFrom(e.target.value)
              }}
              style={{
                height: 34,
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setOffset(0)
                setTo(e.target.value)
              }}
              style={{
                height: 34,
                borderRadius: 10,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                padding: '0 10px',
                fontSize: 13,
              }}
            />
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom('')
              setTo('')
              setOffset(0)
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      {err && (
        <Card title="Could not load" subtitle={err}>
          Please try reloading the page.
        </Card>
      )}

      {!err && !data && <Card title="Loading…" subtitle="Fetching event history" padded={false}>
        <div />
      </Card>}

      {data && (
        <Card
          title="Events"
          subtitle={`Showing ${Math.min(data.offset + data.limit, data.total)} of ${data.total}`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
              Offset {data.offset}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOffset((x) => Math.max(0, x - limit))}
                disabled={data.offset <= 0}
              >
                Prev
              </Button>
              <Button
                variant="solid"
                size="sm"
                onClick={() => setOffset((x) => x + limit)}
                disabled={data.offset + data.limit >= data.total}
              >
                Next
              </Button>
            </div>
          </div>

          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Timestamp', 'Type', 'Entity', 'Points', 'Cap'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.eventId} style={{ background: e.capReached ? 'rgba(201,138,31,0.08)' : undefined }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800 }}>
                      {e.eventType}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{e.entityId}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {e.pointsAwarded}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {e.capReached ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color: 'var(--warn)' }}>YES</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AppShell>
  )
}


