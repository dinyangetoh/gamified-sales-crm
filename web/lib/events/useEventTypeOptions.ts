'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { SIMULATOR_EVENT_TYPES, type SimulatorEventType } from '@/lib/events/eventSimulatorTypes'

export type EventTypeOption = {
  value: SimulatorEventType
  displayName: string
  shortName: string
}

const FALLBACK: EventTypeOption[] = SIMULATOR_EVENT_TYPES.map((t) => ({
  value: t.value,
  displayName: t.label,
  shortName: t.label,
}))

export function useEventTypeOptions() {
  const [options, setOptions] = useState<EventTypeOption[]>(FALLBACK)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch<EventTypeOption[]>('/config/event-types')
        if (cancelled || !res.length) return
        setOptions(res)
      } catch {
        /* keep fallback */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return options
}
