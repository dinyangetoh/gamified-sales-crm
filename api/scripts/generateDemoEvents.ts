/**
 * Generates demo/events/*.json and manifest.json (run once or when refreshing fixtures).
 * Usage: npx ts-node -r dotenv/config scripts/generateDemoEvents.ts
 */
import { randomUUID } from 'crypto'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  addDays,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  startOfISOWeek,
} from 'date-fns'
import { EventType } from '../generated/prisma/client'

const DEMO_EVENTS_DIR = join(__dirname, '../../demo/events')

const U = {
  alice: '00000002-0001-4001-8001-000000000002',
  bob: '00000003-0001-4001-8001-000000000003',
  charlie: '00000004-0001-4001-8001-000000000004',
  diana: '00000005-0001-4001-8001-000000000005',
  evan: '00000006-0001-4001-8001-000000000006',
  fiona: '00000007-0001-4001-8001-000000000007',
  george: '00000008-0001-4001-8001-000000000008',
  hannah: '00000009-0001-4001-8001-000000000009',
} as const

type RepKey = keyof typeof U

interface DemoEventDraft {
  eventId: string
  userId: string
  eventType: EventType
  entityId: string
  timestamp: string
  provider: string
}

const WEEK_MAP: Array<{ file: string; label: string; isoWeek: string }> = [
  { file: '2026-W19.json', label: 'W19', isoWeek: '2026-W16' },
  { file: '2026-W20.json', label: 'W20', isoWeek: '2026-W17' },
  { file: '2026-W21.json', label: 'W21', isoWeek: '2026-W18' },
  { file: '2026-W22.json', label: 'W22', isoWeek: '2026-W19' },
  { file: '2026-W23.json', label: 'W23', isoWeek: '2026-W20' },
  { file: '2026-W24.json', label: 'W24', isoWeek: '2026-W21' },
  { file: '2026-W25.json', label: 'W25', isoWeek: '2026-W22' },
]

function isoWeekStart(isoWeek: string): Date {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)
  const jan4 = new Date(Date.UTC(year, 0, 4, 12, 0, 0, 0))
  const week1 = startOfISOWeek(jan4)
  return addDays(week1, (week - 1) * 7)
}

function atWeekday(
  isoWeek: string,
  weekdayIndex: number,
  hour: number,
  minute: number,
): Date {
  const monday = isoWeekStart(isoWeek)
  let d = addDays(monday, weekdayIndex)
  d = setHours(d, hour)
  d = setMinutes(d, minute)
  d = setSeconds(d, 0)
  d = setMilliseconds(d, 0)
  return d
}

let entityCounter = 0

function entity(prefix: string): string {
  entityCounter += 1
  return `${prefix}-${entityCounter}`
}

function ev(
  userId: string,
  eventType: EventType,
  when: Date,
  prefix: string,
): DemoEventDraft {
  return {
    eventId: randomUUID(),
    userId,
    eventType,
    entityId: entity(prefix),
    timestamp: when.toISOString(),
    provider: 'generic',
  }
}

function spreadRepWeek(
  isoWeek: string,
  rep: RepKey,
  pattern: Array<{ day: number; types: EventType[] }>,
): DemoEventDraft[] {
  const out: DemoEventDraft[] = []
  let slot = 0
  for (const row of pattern) {
    for (const type of row.types) {
      const hour = 9 + ((slot + row.day) % 8)
      const minute = (slot * 7) % 60
      out.push(ev(U[rep], type, atWeekday(isoWeek, row.day, hour, minute), `${rep}-${type}`))
      slot++
    }
  }
  return out
}

function buildWeekEvents(isoWeek: string, fileLabel: string): DemoEventDraft[] {
  const events: DemoEventDraft[] = []

  const filler = (rep: RepKey, days: number[]) => {
    const pattern = days.map((day, i) => ({
      day,
      types: [
        [EventType.LEAD_CONTACTED, EventType.MEETING_COMPLETED, EventType.STAGE_ADVANCED][i % 3],
      ] as EventType[],
    }))
    events.push(...spreadRepWeek(isoWeek, rep, pattern))
  }

  const baseWeek = (activeReps: RepKey[], days: number[] = [0, 2, 4]) => {
    for (const rep of activeReps) {
      filler(rep, days)
    }
  }

  switch (fileLabel) {
    case 'W19':
      baseWeek(['alice', 'bob', 'charlie', 'diana', 'evan'])
      events.push(ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 1, 11, 0), 'alice-deal'))
      events.push(ev(U.fiona, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 3, 10, 0), 'fiona-mtg'))
      events.push(ev(U.george, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 4, 14, 0), 'george-lead'))
      break
    case 'W20':
      baseWeek(['alice', 'bob', 'diana', 'evan', 'fiona'])
      events.push(ev(U.alice, EventType.DEAL_LOST, atWeekday(isoWeek, 2, 16, 0), 'alice-lost'))
      events.push(ev(U.bob, EventType.DEAL_LOST, atWeekday(isoWeek, 3, 13, 0), 'bob-lost'))
      events.push(ev(U.charlie, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 1, 9, 30), 'charlie-stage'))
      break
    case 'W21':
      baseWeek(['bob', 'charlie', 'diana', 'evan', 'george'])
      events.push(ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 0, 10, 0), 'alice-win'))
      events.push(ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 11, 0), 'fiona-lead'))
      events.push(ev(U.charlie, EventType.DEAL_LOST, atWeekday(isoWeek, 3, 11, 0), 'charlie-lost'))
      break
    case 'W22':
      baseWeek(['alice', 'bob', 'charlie', 'diana', 'fiona'])
      events.push(
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 0, 10, 0), 'alice-cc-w22-1'),
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 2, 11, 0), 'alice-cc-w22-2'),
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 4, 15, 0), 'alice-cc-w22-3'),
      )
      events.push(ev(U.evan, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 2, 14, 0), 'evan-mtg'))
      events.push(ev(U.diana, EventType.DEAL_LOST, atWeekday(isoWeek, 4, 16, 30), 'diana-lost'))
      events.push(ev(U.hannah, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 0, 9, 0), 'hannah-lead'))
      break
    case 'W23':
      baseWeek(['alice', 'bob', 'charlie', 'diana', 'evan', 'fiona'])
      events.push(
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 0, 9, 0), 'bob-pipe-w23-1'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 1, 10, 0), 'bob-pipe-w23-2'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 2, 11, 0), 'bob-pipe-w23-3'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 3, 14, 0), 'bob-pipe-w23-4'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 4, 15, 0), 'bob-pipe-w23-5'),
      )
      events.push(
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 0, 9, 30), 'fiona-streak-w23-1'),
        ev(U.fiona, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 1, 10, 30), 'fiona-streak-w23-2'),
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 11, 30), 'fiona-streak-w23-3'),
        ev(U.fiona, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 3, 13, 0), 'fiona-streak-w23-4'),
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 4, 14, 30), 'fiona-streak-w23-5'),
      )
      events.push(ev(U.diana, EventType.DEAL_WON, atWeekday(isoWeek, 2, 10, 0), 'diana-win'))
      events.push(ev(U.george, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 4, 15, 0), 'george-stage'))
      break
    case 'W24':
      events.push(
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 0, 9, 0), 'bob-pipe-1'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 1, 10, 0), 'bob-pipe-2'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 2, 11, 0), 'bob-pipe-3'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 3, 14, 0), 'bob-pipe-4'),
        ev(U.bob, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 4, 15, 0), 'bob-pipe-5'),
      )
      events.push(
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 0, 11, 0), 'alice-cc-1'),
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 2, 11, 30), 'alice-cc-2'),
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 4, 16, 0), 'alice-cc-3'),
      )
      baseWeek(['alice', 'charlie', 'diana', 'evan'], [0, 2, 4])
      events.push(ev(U.bob, EventType.DEAL_WON, atWeekday(isoWeek, 4, 17, 0), 'bob-first-win'))
      events.push(ev(U.hannah, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 10, 0), 'hannah-last'))
      events.push(ev(U.hannah, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 3, 11, 0), 'hannah-last2'))
      break
    case 'W25': {
      const capDay = atWeekday(isoWeek, 1, 10, 0)
      for (let i = 0; i < 8; i++) {
        const t = new Date(capDay.getTime() + i * 3 * 60_000)
        events.push(ev(U.george, EventType.LEAD_CONTACTED, t, `george-cap-${i + 1}`))
      }
      events.push(
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 0, 9, 0), 'fiona-streak-w25-1'),
        ev(U.fiona, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 1, 10, 0), 'fiona-streak-w25-2'),
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 11, 0), 'fiona-streak-w25-3'),
        ev(U.fiona, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 3, 13, 0), 'fiona-streak-w25-4'),
        ev(U.fiona, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 4, 14, 0), 'fiona-streak-w25-5'),
      )
      events.push(
        ev(U.alice, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 0, 9, 30), 'alice-w25-1'),
        ev(U.alice, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 1, 10, 30), 'alice-w25-2'),
        ev(U.alice, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 14, 0), 'alice-w25-3'),
        ev(U.alice, EventType.DEAL_WON, atWeekday(isoWeek, 2, 16, 30), 'alice-w25-deal'),
      )
      events.push(
        ev(U.diana, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 0, 11, 0), 'diana-w25-1'),
        ev(U.diana, EventType.DEAL_WON, atWeekday(isoWeek, 1, 15, 0), 'diana-w25-2'),
        ev(U.diana, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 2, 10, 0), 'diana-w25-3'),
      )
      events.push(
        ev(U.evan, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 0, 10, 0), 'evan-w25-1'),
        ev(U.evan, EventType.MEETING_COMPLETED, atWeekday(isoWeek, 1, 11, 0), 'evan-w25-2'),
        ev(U.evan, EventType.STAGE_ADVANCED, atWeekday(isoWeek, 2, 13, 0), 'evan-w25-3'),
        ev(U.evan, EventType.LEAD_CONTACTED, atWeekday(isoWeek, 2, 15, 30), 'evan-w25-4'),
      )
      events.push(ev(U.george, EventType.DEAL_WON, atWeekday(isoWeek, 2, 17, 0), 'george-win'))
      events.push(ev(U.charlie, EventType.DEAL_WON, atWeekday(isoWeek, 1, 14, 0), 'charlie-win'))
      baseWeek(['bob'], [0, 4])
      break
    }
    default:
      break
  }

  return events
}

function main(): void {
  mkdirSync(DEMO_EVENTS_DIR, { recursive: true })
  entityCounter = 0

  const manifestWeeks: Array<{
    file: string
    label: string
    isoWeek: string
    weekStart: string
    weekEnd: string
  }> = []

  let totalEvents = 0

  for (const w of WEEK_MAP) {
    const start = isoWeekStart(w.isoWeek)
    const end = endOfISOWeek(start)
    const events = buildWeekEvents(w.isoWeek, w.label)

    const payload = {
      isoWeek: w.isoWeek,
      weekStart: format(start, 'yyyy-MM-dd'),
      weekEnd: format(end, 'yyyy-MM-dd'),
      events,
    }

    writeFileSync(join(DEMO_EVENTS_DIR, w.file), `${JSON.stringify(payload, null, 2)}\n`)
    manifestWeeks.push({
      file: w.file,
      label: w.label,
      isoWeek: w.isoWeek,
      weekStart: payload.weekStart,
      weekEnd: payload.weekEnd,
    })
    totalEvents += events.length
    console.log(`Wrote ${w.file} (${events.length} events, ${w.isoWeek})`)
  }

  const manifest = {
    anchorDate: '2026-05-27',
    timezone: 'UTC',
    currentWeekFile: '2026-W25.json',
    currentIsoWeek: '2026-W22',
    weeks: manifestWeeks,
  }

  writeFileSync(join(DEMO_EVENTS_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`\nTotal events: ${totalEvents}`)
  console.log(`Current leaderboard week: ${manifest.currentIsoWeek}`)
}

main()
