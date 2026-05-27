'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import SearchField from '@/components/ui/SearchField'
import EventStatusChip from '@/components/ui/EventStatusChip'
import Donut from '@/components/charts/Donut'
import DonutLegend from '@/components/charts/DonutLegend'
import StatWithTrend from '@/components/charts/StatWithTrend'
import { MY_EVENT_MIX, MY_PREV_WEEK, MY_WEEK_PTS } from '@/lib/design/repDemo'
import useSession from '@/lib/auth/useSession'
import { apiFetch } from '@/lib/api/client'
import Button from '@/components/ui/Button'

type EventFeedResponse = {
  events: Array<{
    eventId: string
    eventType: string
    entityId: string
    pointsAwarded: number
    capReached: boolean
    createdAt: string
  }>
  total: number
  limit: number
  offset: number
}

function toIsoOrUndefined(value: string) {
  if (!value) return undefined
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

export default function ActivityPage() {
  const { session } = useSession()
  const userId = session?.sub

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filter, setFilter] = useState('')
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  const [data, setData] = useState<EventFeedResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    const fromIso = toIsoOrUndefined(from)
    const toIso = toIsoOrUndefined(to)
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

  const events = useMemo(() => {
    const list = data?.events ?? []
    const q = filter.trim().toLowerCase()
    if (!q) return list
    return list.filter((e) => e.entityId.toLowerCase().includes(q) || e.eventType.toLowerCase().includes(q))
  }, [data, filter])

  const weekPts = events.reduce((s, e) => s + e.pointsAwarded, 0)
  const mixTotal = MY_EVENT_MIX.reduce((s, m) => s + m.value, 0)

  return (
    <AppShell
      role="rep"
      active="activity"
      title="Activity"
      sub="Every event scored to your profile, with reasons"
      actions={<SearchField value={filter} onChange={setFilter} placeholder="Filter by entity…" width={220} />}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card title="Event mix" subtitle="Sample week breakdown">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut data={MY_EVENT_MIX} size={130} thickness={16} centerLabel={mixTotal} centerSub="events" />
            <DonutLegend data={MY_EVENT_MIX} total={mixTotal} />
          </div>
        </Card>
        <Card padded={false}>
          <div style={{ padding: '16px 18px' }}>
            <StatWithTrend label="Points · week" value={`+${weekPts}`} delta={22} trend={MY_WEEK_PTS} color="var(--lv4)" />
          </div>
        </Card>
        <Card padded={false}>
          <div style={{ padding: '16px 18px' }}>
            <StatWithTrend
              label="Last week"
              value={`+${MY_PREV_WEEK.reduce((a, b) => a + b, 0)}`}
              trend={MY_PREV_WEEK}
              color="var(--muted)"
            />
          </div>
        </Card>
        <Card padded={false}>
          <div style={{ padding: '16px 18px' }}>
            <StatWithTrend label="Events" value={String(data?.total ?? 0)} unit="total" color="var(--lv2)" />
          </div>
        </Card>
      </div>

      <Card title="Date range" subtitle="Optional from/to · server-backed pagination">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>From</span>
            <input type="date" value={from} onChange={(e) => { setOffset(0); setFrom(e.target.value) }} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>To</span>
            <input type="date" value={to} onChange={(e) => { setOffset(0); setTo(e.target.value) }} style={inputStyle} />
          </label>
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setOffset(0) }}>
            Clear
          </Button>
        </div>
      </Card>

      {err && <Card title="Could not load" subtitle={err} />}
      {!err && !data && <Card title="Loading…" subtitle="Fetching event history"> </Card>}

      {data && (
        <Card title="Event log" subtitle={`${data.total} events total`} padded={false} style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', alignItems: 'center' }}>
            <span className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
              Offset {data.offset}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setOffset((x) => Math.max(0, x - limit))} disabled={data.offset <= 0}>
                Prev
              </Button>
              <Button variant="solid" size="sm" onClick={() => setOffset((x) => x + limit)} disabled={data.offset + data.limit >= data.total}>
                Next
              </Button>
            </div>
          </div>
          <DataTable
            gridTemplateColumns="140px 1fr 1.2fr 80px 100px"
            rows={events}
            rowKey={(e) => e.eventId}
            columns={[
              {
                key: 'time',
                header: 'When',
                render: (e) => (
                  <span className="num" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                render: (e) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{e.eventType}</span>,
              },
              {
                key: 'entity',
                header: 'Entity',
                render: (e) => <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{e.entityId}</span>,
              },
              {
                key: 'pts',
                header: 'Pts',
                align: 'right',
                render: (e) => (
                  <span className="num" style={{ fontSize: 13, fontWeight: 600, color: e.pointsAwarded < 0 ? 'var(--danger)' : 'var(--ink)' }}>
                    {e.pointsAwarded > 0 ? '+' : ''}
                    {e.pointsAwarded}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                align: 'right',
                render: (e) => <EventStatusChip capped={e.capReached} />,
              },
            ]}
          />
        </Card>
      )}
    </AppShell>
  )
}

const inputStyle: React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
}
