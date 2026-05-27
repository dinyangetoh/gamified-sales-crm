import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getDay, parseISO } from 'date-fns'
import { getIsoWeek } from '../modules/scoring/isoWeekUtils'
import {
  demoEventSchema,
  demoManifestSchema,
  demoWeekFileSchema,
  type DemoEvent,
  type DemoManifest,
  type DemoWeekFile,
} from './demoEvent.schema'
import { demoEventsDir, demoManifestPath, demoUsersPath } from './demoPaths'

export interface DemoUsersFile {
  passwordHint: string
  users: Array<{
    id: string
    email: string
    name: string
    role: string
    crmExternalId?: string
  }>
}

export function loadDemoUsers(): DemoUsersFile {
  return JSON.parse(readFileSync(demoUsersPath(), 'utf-8')) as DemoUsersFile
}

export function loadDemoManifest(): DemoManifest {
  const raw = JSON.parse(readFileSync(demoManifestPath(), 'utf-8'))
  return demoManifestSchema.parse(raw)
}

export function loadDemoWeekFile(filename: string): DemoWeekFile {
  const raw = JSON.parse(readFileSync(join(demoEventsDir(), filename), 'utf-8'))
  return demoWeekFileSchema.parse(raw)
}

export function loadAllDemoEvents(): DemoEvent[] {
  const manifest = loadDemoManifest()
  const userIds = new Set(loadDemoUsers().users.map((u) => u.id))
  const events: DemoEvent[] = []

  for (const week of manifest.weeks) {
    const file = loadDemoWeekFile(week.file)
    if (file.isoWeek !== week.isoWeek) {
      throw new Error(`${week.file}: isoWeek ${file.isoWeek} does not match manifest ${week.isoWeek}`)
    }

    for (const event of file.events) {
      if (!userIds.has(event.userId)) {
        throw new Error(`${week.file}: unknown userId ${event.userId}`)
      }
      validateEventCalendar(event, file.weekStart, file.weekEnd, file.isoWeek)
      events.push(event)
    }
  }

  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function validateEventCalendar(
  event: DemoEvent,
  weekStart: string,
  weekEnd: string,
  isoWeek: string,
): void {
  const ts = parseISO(event.timestamp)
  const day = getDay(ts)
  if (day === 0 || day === 6) {
    throw new Error(`Event ${event.eventId} falls on weekend: ${event.timestamp}`)
  }

  const start = parseISO(`${weekStart}T00:00:00.000Z`)
  const end = parseISO(`${weekEnd}T23:59:59.999Z`)
  if (ts < start || ts > end) {
    throw new Error(`Event ${event.eventId} timestamp ${event.timestamp} outside ${weekStart}..${weekEnd}`)
  }

  if (getIsoWeek(ts) !== isoWeek) {
    throw new Error(
      `Event ${event.eventId} ISO week ${getIsoWeek(ts)} does not match file isoWeek ${isoWeek}`,
    )
  }

  demoEventSchema.parse(event)
}

export function listWeekEventFiles(): string[] {
  return readdirSync(demoEventsDir())
    .filter((f) => f.match(/^2026-W\d{2}\.json$/))
    .sort()
}
