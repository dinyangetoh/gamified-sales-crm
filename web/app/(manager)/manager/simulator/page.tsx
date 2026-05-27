'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import ManagerEventSimulator from '@/components/manager/ManagerEventSimulator'
import { apiFetch } from '@/lib/api/client'

type SalesRepSummary = {
  userId: string
  name: string
  email: string
}

export default function ManagerSimulatorPage() {
  const [reps, setReps] = useState<SalesRepSummary[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setErr(null)
      try {
        const res = await apiFetch<SalesRepSummary[]>('/manager/reps')
        if (cancelled) return
        setReps(res)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load reps')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AppShell
      role="manager"
      active="simulator"
      title="Event simulator"
      sub="Submit CRM events on behalf of any rep"
    >
      {err && <Card title="Could not load reps" subtitle={err} />}
      {!err && !reps && <Card title="Loading…" subtitle="Fetching team"> </Card>}
      {!err && reps && reps.length === 0 && (
        <Card title="No reps" subtitle="Seed the database or add sales reps to use the simulator." />
      )}
      {!err && reps && reps.length > 0 && <ManagerEventSimulator reps={reps} />}
    </AppShell>
  )
}
