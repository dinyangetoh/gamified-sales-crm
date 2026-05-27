import 'dotenv/config'
import { PrismaClient, EventType, BadgeType, TimelineEventType } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import { getISOWeek, getISOWeekYear, subDays, subWeeks } from 'date-fns'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const PASSWORD_HASH = bcrypt.hashSync('Demo1234!', 10)

function isoWeek(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function daysAgo(n: number): Date {
  return subDays(new Date(), n)
}

async function main(): Promise<void> {
  console.log('Seeding...')

  await prisma.$transaction(async (tx) => {
    // ── Scoring config ─────────────────────────────────────────────────────

    await tx.scoringRule.upsert({ where: { eventType: EventType.LEAD_CONTACTED },    create: { eventType: EventType.LEAD_CONTACTED,    points: 10  }, update: { points: 10  } })
    await tx.scoringRule.upsert({ where: { eventType: EventType.MEETING_COMPLETED }, create: { eventType: EventType.MEETING_COMPLETED, points: 20  }, update: { points: 20  } })
    await tx.scoringRule.upsert({ where: { eventType: EventType.STAGE_ADVANCED },    create: { eventType: EventType.STAGE_ADVANCED,    points: 30  }, update: { points: 30  } })
    await tx.scoringRule.upsert({ where: { eventType: EventType.DEAL_WON },          create: { eventType: EventType.DEAL_WON,          points: 100 }, update: { points: 100 } })
    await tx.scoringRule.upsert({ where: { eventType: EventType.DEAL_LOST },         create: { eventType: EventType.DEAL_LOST,         points: -20 }, update: { points: -20 } })

    await tx.dailyCapConfig.upsert({ where: { eventType: EventType.LEAD_CONTACTED }, create: { eventType: EventType.LEAD_CONTACTED, maxCount: 5, isActive: true }, update: { maxCount: 5, isActive: true } })

    await tx.levelConfig.upsert({ where: { level: 1 }, create: { level: 1, minXP: 0,   label: 'Rookie' }, update: { minXP: 0,   label: 'Rookie' } })
    await tx.levelConfig.upsert({ where: { level: 2 }, create: { level: 2, minXP: 100, label: 'Closer' }, update: { minXP: 100, label: 'Closer' } })
    await tx.levelConfig.upsert({ where: { level: 3 }, create: { level: 3, minXP: 250, label: 'Elite'  }, update: { minXP: 250, label: 'Elite'  } })
    await tx.levelConfig.upsert({ where: { level: 4 }, create: { level: 4, minXP: 500, label: 'Legend' }, update: { minXP: 500, label: 'Legend' } })

    // ── CRM integration ────────────────────────────────────────────────────

    await tx.crmIntegration.upsert({
      where: { id: 'generic' },
      create: { id: 'generic', displayName: 'Generic Webhook', webhookSecret: 'demo-secret-change-in-production' },
      update: {},
    })

    // ── Users ──────────────────────────────────────────────────────────────

    const manager = await tx.user.upsert({
      where: { email: 'manager@demo.com' },
      create: { email: 'manager@demo.com', passwordHash: PASSWORD_HASH, name: 'Manager Demo', role: 'MANAGER' },
      update: {},
    })

    const alice = await tx.user.upsert({
      where: { email: 'alice@demo.com' },
      create: { email: 'alice@demo.com', passwordHash: PASSWORD_HASH, name: 'Alice Smith', role: 'SALES_REP' },
      update: {},
    })
    const bob = await tx.user.upsert({
      where: { email: 'bob@demo.com' },
      create: { email: 'bob@demo.com', passwordHash: PASSWORD_HASH, name: 'Bob Chen', role: 'SALES_REP' },
      update: {},
    })
    const charlie = await tx.user.upsert({
      where: { email: 'charlie@demo.com' },
      create: { email: 'charlie@demo.com', passwordHash: PASSWORD_HASH, name: 'Charlie Davis', role: 'SALES_REP' },
      update: {},
    })
    const diana = await tx.user.upsert({
      where: { email: 'diana@demo.com' },
      create: { email: 'diana@demo.com', passwordHash: PASSWORD_HASH, name: 'Diana Osei', role: 'SALES_REP' },
      update: {},
    })
    const evan = await tx.user.upsert({
      where: { email: 'evan@demo.com' },
      create: { email: 'evan@demo.com', passwordHash: PASSWORD_HASH, name: 'Evan Park', role: 'SALES_REP' },
      update: {},
    })
    const fiona = await tx.user.upsert({
      where: { email: 'fiona@demo.com' },
      create: { email: 'fiona@demo.com', passwordHash: PASSWORD_HASH, name: 'Fiona Walsh', role: 'SALES_REP' },
      update: {},
    })
    const george = await tx.user.upsert({
      where: { email: 'george@demo.com' },
      create: { email: 'george@demo.com', passwordHash: PASSWORD_HASH, name: 'George Torres', role: 'SALES_REP' },
      update: {},
    })
    const hannah = await tx.user.upsert({
      where: { email: 'hannah@demo.com' },
      create: { email: 'hannah@demo.com', passwordHash: PASSWORD_HASH, name: 'Hannah Lee', role: 'SALES_REP' },
      update: {},
    })

    const users = { alice, bob, charlie, diana, evan, fiona, george, hannah }

    // ── Events ─────────────────────────────────────────────────────────────
    // W1 = current week, W2 = last week

    const w1 = isoWeek(new Date())
    const w2 = isoWeek(subWeeks(new Date(), 1))

    interface EventSeed {
      eventId: string
      userId: string
      eventType: EventType
      entityId: string
      timestamp: Date
      pointsAwarded: number
      capReached: boolean
    }

    const events: EventSeed[] = [
      // ── Alice: 7-day streak, FIRST_WIN (W2), CONSISTENT_CLOSER (W1) ─────
      { eventId: 'alice-w2-1', userId: alice.id, eventType: EventType.DEAL_WON,       entityId: 'deal-a1', timestamp: daysAgo(10), pointsAwarded: 100, capReached: false },
      { eventId: 'alice-w2-2', userId: alice.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-a2', timestamp: daysAgo(10), pointsAwarded: 30,  capReached: false },
      { eventId: 'alice-w2-3', userId: alice.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-a1', timestamp: daysAgo(9), pointsAwarded: 20, capReached: false },
      { eventId: 'alice-w2-4', userId: alice.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-a1', timestamp: daysAgo(9), pointsAwarded: 10, capReached: false },
      { eventId: 'alice-w2-5', userId: alice.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-a3', timestamp: daysAgo(8), pointsAwarded: 30, capReached: false },
      { eventId: 'alice-w1-1', userId: alice.id, eventType: EventType.DEAL_WON,       entityId: 'deal-a4', timestamp: daysAgo(6), pointsAwarded: 100, capReached: false },
      { eventId: 'alice-w1-2', userId: alice.id, eventType: EventType.DEAL_WON,       entityId: 'deal-a5', timestamp: daysAgo(5), pointsAwarded: 100, capReached: false },
      { eventId: 'alice-w1-3', userId: alice.id, eventType: EventType.DEAL_WON,       entityId: 'deal-a6', timestamp: daysAgo(4), pointsAwarded: 100, capReached: false }, // CONSISTENT_CLOSER
      { eventId: 'alice-w1-4', userId: alice.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-a2', timestamp: daysAgo(3), pointsAwarded: 20, capReached: false },
      { eventId: 'alice-w1-5', userId: alice.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-a2', timestamp: daysAgo(2), pointsAwarded: 10, capReached: false },
      { eventId: 'alice-w1-6', userId: alice.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-a7', timestamp: daysAgo(1), pointsAwarded: 30, capReached: false },
      { eventId: 'alice-w1-7', userId: alice.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-a3', timestamp: daysAgo(0), pointsAwarded: 20, capReached: false }, // 7-day streak

      // ── Bob: PIPELINE_BUILDER (W1) ────────────────────────────────────────
      { eventId: 'bob-w2-1',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b1', timestamp: daysAgo(10), pointsAwarded: 30,  capReached: false },
      { eventId: 'bob-w2-2',  userId: bob.id, eventType: EventType.LEAD_CONTACTED,  entityId: 'lead-b1', timestamp: daysAgo(9),  pointsAwarded: 10,  capReached: false },
      { eventId: 'bob-w1-1',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b2', timestamp: daysAgo(6),  pointsAwarded: 30,  capReached: false },
      { eventId: 'bob-w1-2',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b3', timestamp: daysAgo(5),  pointsAwarded: 30,  capReached: false },
      { eventId: 'bob-w1-3',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b4', timestamp: daysAgo(4),  pointsAwarded: 30,  capReached: false },
      { eventId: 'bob-w1-4',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b5', timestamp: daysAgo(3),  pointsAwarded: 30,  capReached: false },
      { eventId: 'bob-w1-5',  userId: bob.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-b6', timestamp: daysAgo(2),  pointsAwarded: 30,  capReached: false }, // PIPELINE_BUILDER
      { eventId: 'bob-w1-6',  userId: bob.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-b1', timestamp: daysAgo(1), pointsAwarded: 20, capReached: false },
      { eventId: 'bob-w1-7',  userId: bob.id, eventType: EventType.DEAL_WON,       entityId: 'deal-b7', timestamp: daysAgo(1),  pointsAwarded: 100, capReached: false },

      // ── Charlie: first win this week ────────────────────────────────────
      { eventId: 'charlie-w1-1', userId: charlie.id, eventType: EventType.LEAD_CONTACTED,   entityId: 'lead-c1', timestamp: daysAgo(5), pointsAwarded: 10,  capReached: false },
      { eventId: 'charlie-w1-2', userId: charlie.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-c1', timestamp: daysAgo(4), pointsAwarded: 20,  capReached: false },
      { eventId: 'charlie-w1-3', userId: charlie.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-c1', timestamp: daysAgo(3), pointsAwarded: 30,  capReached: false },
      { eventId: 'charlie-w1-4', userId: charlie.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-c2', timestamp: daysAgo(2), pointsAwarded: 30,  capReached: false },
      { eventId: 'charlie-w1-5', userId: charlie.id, eventType: EventType.DEAL_WON,         entityId: 'deal-c3', timestamp: daysAgo(1), pointsAwarded: 100, capReached: false }, // FIRST_WIN

      // ── Diana: close #2, chasing Alice ──────────────────────────────────
      { eventId: 'diana-w2-1', userId: diana.id, eventType: EventType.DEAL_WON,         entityId: 'deal-d1', timestamp: daysAgo(10), pointsAwarded: 100, capReached: false },
      { eventId: 'diana-w1-1', userId: diana.id, eventType: EventType.LEAD_CONTACTED,   entityId: 'lead-d1', timestamp: daysAgo(6),  pointsAwarded: 10,  capReached: false },
      { eventId: 'diana-w1-2', userId: diana.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-d1', timestamp: daysAgo(5),  pointsAwarded: 20,  capReached: false },
      { eventId: 'diana-w1-3', userId: diana.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-d2', timestamp: daysAgo(4),  pointsAwarded: 30,  capReached: false },
      { eventId: 'diana-w1-4', userId: diana.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-d3', timestamp: daysAgo(3),  pointsAwarded: 30,  capReached: false },
      { eventId: 'diana-w1-5', userId: diana.id, eventType: EventType.DEAL_WON,         entityId: 'deal-d4', timestamp: daysAgo(2),  pointsAwarded: 100, capReached: false },
      { eventId: 'diana-w1-6', userId: diana.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-d2', timestamp: daysAgo(1),  pointsAwarded: 20,  capReached: false },
      { eventId: 'diana-w1-7', userId: diana.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-d5', timestamp: daysAgo(0),  pointsAwarded: 30,  capReached: false },

      // ── Evan: comeback (80 pts W2 → 160 pts W1) ─────────────────────────
      { eventId: 'evan-w2-1', userId: evan.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-e1', timestamp: daysAgo(11), pointsAwarded: 10, capReached: false },
      { eventId: 'evan-w2-2', userId: evan.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-e1', timestamp: daysAgo(10), pointsAwarded: 20, capReached: false },
      { eventId: 'evan-w2-3', userId: evan.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-e1', timestamp: daysAgo(9), pointsAwarded: 30, capReached: false },
      { eventId: 'evan-w2-4', userId: evan.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-e2', timestamp: daysAgo(8), pointsAwarded: 20, capReached: false },
      { eventId: 'evan-w1-1', userId: evan.id, eventType: EventType.STAGE_ADVANCED,    entityId: 'deal-e2', timestamp: daysAgo(6), pointsAwarded: 30, capReached: false },
      { eventId: 'evan-w1-2', userId: evan.id, eventType: EventType.STAGE_ADVANCED,    entityId: 'deal-e3', timestamp: daysAgo(5), pointsAwarded: 30, capReached: false },
      { eventId: 'evan-w1-3', userId: evan.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-e3', timestamp: daysAgo(4), pointsAwarded: 20, capReached: false },
      { eventId: 'evan-w1-4', userId: evan.id, eventType: EventType.LEAD_CONTACTED,    entityId: 'lead-e2', timestamp: daysAgo(3), pointsAwarded: 10, capReached: false },
      { eventId: 'evan-w1-5', userId: evan.id, eventType: EventType.STAGE_ADVANCED,    entityId: 'deal-e4', timestamp: daysAgo(2), pointsAwarded: 30, capReached: false },
      { eventId: 'evan-w1-6', userId: evan.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-e4', timestamp: daysAgo(1), pointsAwarded: 20, capReached: false },
      { eventId: 'evan-w1-7', userId: evan.id, eventType: EventType.LEAD_CONTACTED,    entityId: 'lead-e3', timestamp: daysAgo(0), pointsAwarded: 10, capReached: false },

      // ── Fiona: 5-day streak → HOT_STREAK ─────────────────────────────────
      { eventId: 'fiona-w1-1', userId: fiona.id, eventType: EventType.LEAD_CONTACTED,   entityId: 'lead-f1', timestamp: daysAgo(4), pointsAwarded: 10, capReached: false },
      { eventId: 'fiona-w1-2', userId: fiona.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-f1', timestamp: daysAgo(3), pointsAwarded: 20, capReached: false },
      { eventId: 'fiona-w1-3', userId: fiona.id, eventType: EventType.LEAD_CONTACTED,   entityId: 'lead-f2', timestamp: daysAgo(2), pointsAwarded: 10, capReached: false },
      { eventId: 'fiona-w1-4', userId: fiona.id, eventType: EventType.STAGE_ADVANCED,   entityId: 'deal-f1', timestamp: daysAgo(1), pointsAwarded: 30, capReached: false },
      { eventId: 'fiona-w1-5', userId: fiona.id, eventType: EventType.LEAD_CONTACTED,   entityId: 'lead-f3', timestamp: daysAgo(0), pointsAwarded: 10, capReached: false }, // HOT_STREAK day 5

      // ── George: 8 LEAD_CONTACTED same day (cap overflow demo) ─────────────
      { eventId: 'george-cap-1', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g1', timestamp: daysAgo(1), pointsAwarded: 10, capReached: false },
      { eventId: 'george-cap-2', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g2', timestamp: daysAgo(1), pointsAwarded: 10, capReached: false },
      { eventId: 'george-cap-3', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g3', timestamp: daysAgo(1), pointsAwarded: 10, capReached: false },
      { eventId: 'george-cap-4', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g4', timestamp: daysAgo(1), pointsAwarded: 10, capReached: false },
      { eventId: 'george-cap-5', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g5', timestamp: daysAgo(1), pointsAwarded: 10, capReached: false },
      { eventId: 'george-cap-6', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g6', timestamp: daysAgo(1), pointsAwarded: 0,  capReached: true  }, // cap hit
      { eventId: 'george-cap-7', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g7', timestamp: daysAgo(1), pointsAwarded: 0,  capReached: true  },
      { eventId: 'george-cap-8', userId: george.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-g8', timestamp: daysAgo(1), pointsAwarded: 0,  capReached: true  },
      { eventId: 'george-w1-1',  userId: george.id, eventType: EventType.DEAL_WON,       entityId: 'deal-g1', timestamp: daysAgo(0), pointsAwarded: 100, capReached: false },

      // ── Hannah: last active last week — streak at risk ────────────────────
      { eventId: 'hannah-w2-1', userId: hannah.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-h1', timestamp: daysAgo(9),  pointsAwarded: 10, capReached: false },
      { eventId: 'hannah-w2-2', userId: hannah.id, eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-h1', timestamp: daysAgo(8), pointsAwarded: 20, capReached: false },

      // ── Duplicates (eventId submitted twice — second scores 0 via PK) ─────
      // These are stored once; their IDs are tested in E2E via double-submit
      { eventId: 'dup-evt-001', userId: alice.id, eventType: EventType.LEAD_CONTACTED, entityId: 'lead-dup1', timestamp: daysAgo(3), pointsAwarded: 10, capReached: false },
      { eventId: 'dup-evt-002', userId: bob.id,   eventType: EventType.MEETING_COMPLETED, entityId: 'mtg-dup1', timestamp: daysAgo(3), pointsAwarded: 20, capReached: false },
      { eventId: 'dup-evt-003', userId: charlie.id, eventType: EventType.STAGE_ADVANCED, entityId: 'deal-dup1', timestamp: daysAgo(3), pointsAwarded: 30, capReached: false },

      // ── DEAL_LOST events (negative points, XP floor test) ─────────────────
      { eventId: 'alice-lost-1',  userId: alice.id,  eventType: EventType.DEAL_LOST, entityId: 'deal-lost-1', timestamp: daysAgo(8), pointsAwarded: -20, capReached: false },
      { eventId: 'bob-lost-1',    userId: bob.id,    eventType: EventType.DEAL_LOST, entityId: 'deal-lost-2', timestamp: daysAgo(7), pointsAwarded: -20, capReached: false },
      { eventId: 'charlie-lost',  userId: charlie.id, eventType: EventType.DEAL_LOST, entityId: 'deal-lost-3', timestamp: daysAgo(6), pointsAwarded: -20, capReached: false },
      { eventId: 'diana-lost',    userId: diana.id,  eventType: EventType.DEAL_LOST, entityId: 'deal-lost-4', timestamp: daysAgo(7), pointsAwarded: -20, capReached: false },
    ]

    for (const e of events) {
      await tx.event.upsert({
        where: { eventId: e.eventId },
        create: {
          eventId: e.eventId,
          userId: e.userId,
          provider: 'generic',
          eventType: e.eventType,
          entityId: e.entityId,
          rawPayload: {},
          pointsAwarded: e.pointsAwarded,
          capReached: e.capReached,
          timestamp: e.timestamp,
          processedAt: e.timestamp,
        },
        update: {},
      })
    }

    // ── Compute user stats from events ────────────────────────────────────

    const allUsers = [alice, bob, charlie, diana, evan, fiona, george, hannah]

    for (const user of allUsers) {
      const userEvents = events.filter((e) => e.userId === user.id)
      const totalPoints = userEvents.reduce((sum, e) => sum + e.pointsAwarded, 0)
      const totalXP = Math.max(0, totalPoints)
      const level = totalXP >= 500 ? 4 : totalXP >= 250 ? 3 : totalXP >= 100 ? 2 : 1

      const sortedEvents = userEvents
        .filter((e) => e.pointsAwarded !== 0 && !e.capReached)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      let currentStreak = 0
      let longestStreak = 0
      let lastDate: Date | null = null

      for (const ev of sortedEvents) {
        const evDate = new Date(ev.timestamp)
        evDate.setHours(0, 0, 0, 0)

        if (!lastDate) {
          currentStreak = 1
        } else {
          const prev = new Date(lastDate)
          prev.setHours(0, 0, 0, 0)
          const dayDiff = Math.round((evDate.getTime() - prev.getTime()) / 86400000)
          if (dayDiff === 0) {
            // same day — no change
          } else if (dayDiff === 1) {
            currentStreak++
          } else {
            currentStreak = 1
          }
        }
        longestStreak = Math.max(longestStreak, currentStreak)
        lastDate = ev.timestamp
      }

      await tx.userStats.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          totalXP,
          totalPoints,
          level,
          currentStreak,
          longestStreak,
          lastActivityDate: lastDate,
        },
        update: {
          totalXP,
          totalPoints,
          level,
          currentStreak,
          longestStreak,
          lastActivityDate: lastDate,
        },
      })
    }

    // ── Weekly stats ──────────────────────────────────────────────────────

    const weeklyAgg = new Map<string, Map<string, number>>()
    for (const e of events) {
      if (e.pointsAwarded === 0) continue
      const week = isoWeek(e.timestamp)
      const key = `${e.userId}:${week}`
      weeklyAgg.set(key, (weeklyAgg.get(key) ?? new Map()))
      const inner = weeklyAgg.get(key)!
      inner.set('points', (inner.get('points') ?? 0) + e.pointsAwarded)
      inner.set('userId', 1)
      inner.set('weekStr', 1)
    }

    const weeklyMap = new Map<string, { userId: string; isoWeek: string; weekPoints: number }>()
    for (const e of events) {
      if (e.pointsAwarded === 0) continue
      const week = isoWeek(e.timestamp)
      const key = `${e.userId}:${week}`
      const existing = weeklyMap.get(key)
      if (existing) {
        existing.weekPoints += e.pointsAwarded
      } else {
        weeklyMap.set(key, { userId: e.userId, isoWeek: week, weekPoints: e.pointsAwarded })
      }
    }

    for (const stat of weeklyMap.values()) {
      await tx.weeklyStat.upsert({
        where: { userId_isoWeek: { userId: stat.userId, isoWeek: stat.isoWeek } },
        create: stat,
        update: { weekPoints: stat.weekPoints },
      })
    }

    // ── Daily caps for George ─────────────────────────────────────────────

    const georgeCapDate = new Date(daysAgo(1))
    georgeCapDate.setHours(0, 0, 0, 0)
    await tx.dailyCap.upsert({
      where: { userId_eventType_date: { userId: george.id, eventType: EventType.LEAD_CONTACTED, date: georgeCapDate } },
      create: { userId: george.id, eventType: EventType.LEAD_CONTACTED, date: georgeCapDate, count: 8 },
      update: { count: 8 },
    })

    // ── Badge awards ──────────────────────────────────────────────────────

    const badgeSeeds = [
      // Alice: FIRST_WIN from W2 deal, CONSISTENT_CLOSER from W1 3x DEAL_WON
      { userId: alice.id, badgeType: BadgeType.FIRST_WIN },
      { userId: alice.id, badgeType: BadgeType.CONSISTENT_CLOSER },
      // Bob: PIPELINE_BUILDER from 5x STAGE_ADVANCED in W1
      { userId: bob.id, badgeType: BadgeType.PIPELINE_BUILDER },
      { userId: bob.id, badgeType: BadgeType.FIRST_WIN },
      // Charlie: FIRST_WIN
      { userId: charlie.id, badgeType: BadgeType.FIRST_WIN },
      // Diana: FIRST_WIN
      { userId: diana.id, badgeType: BadgeType.FIRST_WIN },
      // George: FIRST_WIN from george-w1-1
      { userId: george.id, badgeType: BadgeType.FIRST_WIN },
      // Fiona: HOT_STREAK (5 consecutive days)
      { userId: fiona.id, badgeType: BadgeType.HOT_STREAK },
    ]

    for (const b of badgeSeeds) {
      await tx.badgeAward.upsert({
        where: { userId_badgeType: { userId: b.userId, badgeType: b.badgeType } },
        create: b,
        update: {},
      })
    }

    // ── Badge progress (in-progress badges) ──────────────────────────────

    const currentWeek = isoWeek(new Date())

    await tx.badgeProgress.upsert({
      where: { userId_badgeType_weekKey: { userId: diana.id, badgeType: BadgeType.CONSISTENT_CLOSER, weekKey: currentWeek } },
      create: { userId: diana.id, badgeType: BadgeType.CONSISTENT_CLOSER, currentCount: 2, targetCount: 3, weekKey: currentWeek },
      update: { currentCount: 2 },
    })

    await tx.badgeProgress.upsert({
      where: { userId_badgeType_weekKey: { userId: bob.id, badgeType: BadgeType.CONSISTENT_CLOSER, weekKey: currentWeek } },
      create: { userId: bob.id, badgeType: BadgeType.CONSISTENT_CLOSER, currentCount: 1, targetCount: 3, weekKey: currentWeek },
      update: { currentCount: 1 },
    })

    // ── Award timeline ────────────────────────────────────────────────────

    const timelineSeeds = [
      { userId: alice.id, type: TimelineEventType.BADGE_EARNED,    badgeType: BadgeType.FIRST_WIN,          xpSnapshot: 100, pointsSnapshot: 100, levelSnapshot: 2, weekKey: w2 },
      { userId: alice.id, type: TimelineEventType.BADGE_EARNED,    badgeType: BadgeType.CONSISTENT_CLOSER,  xpSnapshot: 510, pointsSnapshot: 510, levelSnapshot: 4, weekKey: w1 },
      { userId: alice.id, type: TimelineEventType.LEVEL_UP,        badgeType: null, xpSnapshot: 100, pointsSnapshot: 100, levelSnapshot: 2, weekKey: null, metadata: { from: 1, to: 2 } },
      { userId: alice.id, type: TimelineEventType.LEVEL_UP,        badgeType: null, xpSnapshot: 250, pointsSnapshot: 250, levelSnapshot: 3, weekKey: null, metadata: { from: 2, to: 3 } },
      { userId: alice.id, type: TimelineEventType.STREAK_MILESTONE, badgeType: null, xpSnapshot: 510, pointsSnapshot: 510, levelSnapshot: 4, weekKey: null, metadata: { streak: 7 } },
      { userId: bob.id,   type: TimelineEventType.BADGE_EARNED,    badgeType: BadgeType.PIPELINE_BUILDER,   xpSnapshot: 240, pointsSnapshot: 240, levelSnapshot: 2, weekKey: w1 },
      { userId: fiona.id, type: TimelineEventType.BADGE_EARNED,    badgeType: BadgeType.HOT_STREAK,         xpSnapshot: 80,  pointsSnapshot: 80,  levelSnapshot: 1, weekKey: null },
      { userId: fiona.id, type: TimelineEventType.STREAK_MILESTONE, badgeType: null, xpSnapshot: 80, pointsSnapshot: 80, levelSnapshot: 1, weekKey: null, metadata: { streak: 5 } },
      { userId: charlie.id, type: TimelineEventType.BADGE_EARNED,  badgeType: BadgeType.FIRST_WIN,          xpSnapshot: 170, pointsSnapshot: 170, levelSnapshot: 2, weekKey: w1 },
    ]

    for (const t of timelineSeeds) {
      await tx.awardTimeline.create({
        data: {
          userId: t.userId,
          type: t.type,
          badgeType: t.badgeType,
          pointsSnapshot: t.pointsSnapshot,
          xpSnapshot: t.xpSnapshot,
          levelSnapshot: t.levelSnapshot,
          weekKey: t.weekKey,
          metadata: t.metadata ?? undefined,
        },
      })
    }

    // ── CRM user maps ─────────────────────────────────────────────────────

    const crmMaps = [
      { userId: alice.id,   externalId: 'user-alice'   },
      { userId: bob.id,     externalId: 'user-bob'     },
      { userId: charlie.id, externalId: 'user-charlie' },
      { userId: diana.id,   externalId: 'user-diana'   },
      { userId: evan.id,    externalId: 'user-evan'    },
      { userId: fiona.id,   externalId: 'user-fiona'   },
      { userId: george.id,  externalId: 'user-george'  },
      { userId: hannah.id,  externalId: 'user-hannah'  },
    ]

    for (const m of crmMaps) {
      await tx.crmUserMap.upsert({
        where: { provider_externalId: { provider: 'generic', externalId: m.externalId } },
        create: { userId: m.userId, provider: 'generic', externalId: m.externalId },
        update: {},
      })
    }
  })

  console.log('Seed complete.')
  console.log('\nDemo accounts (password: Demo1234!):')
  console.log('  manager@demo.com  — MANAGER')
  console.log('  alice@demo.com    — SALES_REP (rank 1, Legend, 7-day streak)')
  console.log('  bob@demo.com      — SALES_REP (Pipeline Builder)')
  console.log('  charlie@demo.com  — SALES_REP (First Win this week)')
  console.log('  diana@demo.com    — SALES_REP (chasing Alice)')
  console.log('  evan@demo.com     — SALES_REP (comeback story)')
  console.log('  fiona@demo.com    — SALES_REP (Hot Streak badge)')
  console.log('  george@demo.com   — SALES_REP (daily cap overflow demo)')
  console.log('  hannah@demo.com   — SALES_REP (streak at risk)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
