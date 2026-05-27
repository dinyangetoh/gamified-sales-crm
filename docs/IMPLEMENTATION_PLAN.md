# Gamification Engine — Implementation Plan
### Architecture Decision Record · CTO Candidate Submission

---

## Table of Contents

1. [Overview](#1-overview)
2. [Scope Tiers](#2-scope-tiers)
3. [Tech Stack](#3-tech-stack)
4. [Repository Structure](#4-repository-structure)
5. [Data Model](#5-data-model)
6. [Architecture & Request Lifecycle](#6-architecture--request-lifecycle)
7. [CRM Integration Layer](#7-crm-integration-layer)
8. [Queue Architecture](#8-queue-architecture)
9. [Transaction Boundaries](#9-transaction-boundaries)
10. [Scoring Engine](#10-scoring-engine)
11. [Anti-Gaming Rules](#11-anti-gaming-rules)
12. [Badge System](#12-badge-system)
13. [Streak Logic](#13-streak-logic)
14. [Award Timeline](#14-award-timeline)
15. [Leaderboard](#15-leaderboard)
16. [Notification System](#16-notification-system)
17. [Cache & Deduplication Adapters](#17-cache--deduplication-adapters)
18. [Authentication & Security](#18-authentication--security)
19. [API Contract](#19-api-contract)
20. [Frontend](#20-frontend)
21. [UI/UX Design Notes](#21-uiux-design-notes)
22. [Testing Strategy](#22-testing-strategy)
23. [Docker & Infrastructure](#23-docker--infrastructure)
24. [Seed Data](#24-seed-data)
25. [Decisions & Tradeoffs](#25-decisions--tradeoffs)
26. [Production Readiness Recommendations](#26-production-readiness-recommendations)
27. [Roadmap](#27-roadmap)

---

## 1. Overview

A production-quality gamification engine for Sales CRM activity. Sales reps earn points,
XP, badges, and leaderboard rankings based on CRM events — calls, meetings, pipeline
advances, wins. The system ingests events from real CRM providers via authenticated
webhooks, processes scoring synchronously inside database transactions for strict
correctness, and defers notifications asynchronously via queues.

This document is both an implementation plan and an Architectural Decision Record. Every
significant decision includes the rationale and the tradeoff accepted. Sections marked
**[MVP]** or **[PROD]** describe designed evolution paths — not implemented in this
submission.

### Core Design Principles

- **Correctness first** — Postgres is the single source of truth. All scoring and badge
  evaluation happens inside explicit transactions. Partial state is not possible.
- **Async where it earns its place** — scoring is synchronous (spec requires points in the
  response). Webhook ingestion, notifications, and scheduled jobs are async via BullMQ.
  Complexity is introduced only where it solves a real problem.
- **Security by default** — every webhook endpoint verifies HMAC signatures before
  touching business logic. Auth guards on every route. Timing-safe comparisons throughout.
- **Adapter boundaries** — cache, deduplication, and CRM provider concerns sit behind
  interfaces. Implementations are swappable without touching business logic.
- **Idempotency at every layer** — Redis fast-path dedup + Postgres unique constraint as
  hard guarantee. The system handles CRM retries and replay attacks correctly.
- **Observable by design** — structured JSON logging, health endpoints, dead-letter queue,
  full audit log, award timeline.

---

## 2. Scope Tiers

This submission implements the **POC tier** completely. MVP and PROD tiers are designed,
scaffolded at the interface level, and documented in Section 27.

### POC — Implemented in This Submission

The complete gamification engine with webhook security, queue-based ingestion, synchronous
scoring, badge system, streak tracking, leaderboard, award timeline, role-based auth,
event simulator, and a polished frontend dashboard.

### MVP — Scaffolded, Not Implemented

CRM-specific adapters (HubSpot owner resolution, Pipedrive), edit endpoints for scoring
rules, full notification suite (level-up, near-badge, rank change, weekly digests),
additional badge automation (TOP_OF_THE_WEEK, COMEBACK_KID).

### PROD / Scale — Architecture Doc Only

Redis Sorted Sets leaderboard, DB-driven badge definitions, per-org scoring rules,
horizontal scaling with distributed locks, Salesforce adapter, Prometheus metrics,
WebSocket live updates, OAuth CRM onboarding.

---

## 3. Tech Stack

### Backend — `api/`

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable, broad ecosystem |
| Framework | NestJS | Opinionated structure, DI, guards, interceptors, pipes. Team already on NestJS. |
| Language | TypeScript (strict) | End-to-end type safety across Prisma ↔ service ↔ DTO boundaries |
| Database | PostgreSQL 16 | ACID transactions, JSON columns, mature indexing. Single source of truth. |
| ORM | Prisma | Fully typed queries, clean migration history, excellent NestJS integration |
| Queue / Cron | BullMQ + `@nestjs/bullmq` | Redis-backed, durable jobs, retry with backoff, cron scheduling, dead-letter |
| Cache / Dedup | Redis 7 via adapter interface | Queue backing store + leaderboard cache + scoring config cache + dedup |
| Validation | class-validator + class-transformer | Declarative DTO validation, co-located with the DTO class |
| Config validation | Zod | Scoring config file schema, all env vars validated on startup |
| API docs | `@nestjs/swagger` | Auto-generated from decorators. Zero manual maintenance. |
| Email | Resend | Modern API, excellent TypeScript SDK. Gracefully disabled if key not set. |
| Logging | nestjs-pino | Structured JSON logs, automatic request ID correlation |
| Health | `@nestjs/terminus` | Postgres + Redis liveness + readiness probes |

### Frontend — `web/`

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server Components, streaming, file-based routing |
| Styling | Tailwind CSS | Rapid UI, consistent design tokens, zero runtime overhead |
| State / API | RTK + RTK Query | Predictable state, automatic cache invalidation, tag-based revalidation |
| Auth | NextAuth.js | Credentials provider → NestJS JWT. HTTP-only cookie storage. |

### Infrastructure

| Concern | Choice |
|---|---|
| Containerisation | Docker + Docker Compose |
| Database | Postgres 16 Alpine |
| Queue / Cache | Redis 7 Alpine with AOF persistence |

---

## 4. Repository Structure

```
/
├── api/                              ← NestJS application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                 ← JWT strategy, login, RolesGuard
│   │   │   ├── users/                ← profile, stats, timeline reads
│   │   │   ├── events/               ← POST /events (canonical + simulator)
│   │   │   ├── webhooks/             ← CRM webhook endpoints + adapter factory
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── crm-adapter.interface.ts
│   │   │   │   │   ├── generic.adapter.ts      ← POC: fully implemented
│   │   │   │   │   ├── hubspot.adapter.ts       ← POC: signature + normalise
│   │   │   │   │   │                              MVP: owner resolution
│   │   │   │   │   └── pipedrive.adapter.ts     ← MVP: full implementation
│   │   │   │   └── webhooks.module.ts
│   │   │   ├── scoring/              ← points engine, cap logic, level derivation
│   │   │   ├── badges/               ← definitions, evaluation, progress tracking
│   │   │   ├── leaderboard/          ← weekly + all-time ranking
│   │   │   ├── notifications/        ← Resend service, notification log
│   │   │   ├── queues/               ← BullMQ definitions + processors
│   │   │   │   ├── processors/
│   │   │   │   │   ├── ingestion.processor.ts
│   │   │   │   │   ├── notification.processor.ts
│   │   │   │   │   └── scheduled.processor.ts
│   │   │   │   └── queues.module.ts
│   │   │   ├── cache/                ← CacheAdapter interface + RedisAdapter
│   │   │   └── health/               ← terminus health + readiness
│   │   ├── common/
│   │   │   ├── guards/               ← WebhookGuard, JwtGuard, RolesGuard
│   │   │   ├── interceptors/         ← LoggingInterceptor, TransformInterceptor
│   │   │   ├── filters/              ← GlobalExceptionFilter
│   │   │   ├── decorators/           ← @CurrentUser, @Roles, @Public
│   │   │   └── pipes/                ← global ValidationPipe
│   │   ├── config/
│   │   │   ├── scoring-config.json   ← default rules, seeds DB on first run
│   │   │   ├── scoring-config.schema.ts  ← Zod validation
│   │   │   └── env.schema.ts         ← Zod env var validation
│   │   ├── prisma/
│   │   │   └── prisma.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts                   ← single transaction, idempotent
│   ├── test/
│   │   ├── unit/
│   │   └── e2e/
│   ├── Dockerfile
│   └── package.json
│
├── web/                              ← Next.js 16 application
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (sales-rep)/
│   │   │   ├── dashboard/            ← XP, rank, badges, timeline, simulator
│   │   │   └── leaderboard/          ← full leaderboard, own row pinned
│   │   └── (manager)/
│   │       ├── dashboard/            ← overview, top performers, health panel
│   │       ├── reps/                 ← roster + rep profile drill-in
│   │       ├── leaderboard/          ← week selector + all-time tab
│   │       └── rules/                ← view-only scoring config
│   ├── store/
│   │   ├── index.ts
│   │   └── api/
│   │       ├── gamification.api.ts   ← RTK Query endpoints
│   │       └── types.ts
│   ├── components/
│   │   ├── leaderboard/
│   │   ├── badges/
│   │   ├── stats/
│   │   ├── simulator/                ← EventSimulator slide-out panel
│   │   └── ui/
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

---

## 5. Data Model

### Design Philosophy

Four concern groups: identity, CRM integration, gamification state, observability.
No cross-concern queries except through explicit service boundaries. Every table has a
clear single owner module.

### Prisma Schema — Complete

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Identity ────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(SALES_REP)
  createdAt    DateTime @default(now())

  stats            UserStats?
  badgeAwards      BadgeAward[]
  badgeProgress    BadgeProgress[]
  weeklyStats      WeeklyStat[]
  dailyCaps        DailyCap[]
  crmUserMaps      CrmUserMap[]
  notificationLogs NotificationLog[]
  awardTimeline    AwardTimeline[]
  events           Event[]
}

enum Role {
  SALES_REP
  MANAGER
}

// ─── CRM Integration ─────────────────────────────────────────────────────────

model CrmIntegration {
  id            String   @id     // 'hubspot' | 'pipedrive' | 'generic'
  displayName   String
  webhookSecret String
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  crmUserMaps CrmUserMap[]
}

// Maps CRM-native user identifiers to internal user UUIDs.
model CrmUserMap {
  id         String   @id @default(uuid())
  userId     String
  provider   String
  externalId String
  createdAt  DateTime @default(now())

  user        User           @relation(fields: [userId], references: [id])
  integration CrmIntegration @relation(fields: [provider], references: [id])

  @@unique([provider, externalId])
  @@index([provider, externalId])
}

// ─── Events — immutable audit log ────────────────────────────────────────────

// eventId is the external CRM event ID and serves as the PK.
// Duplicate events cannot be inserted — Postgres enforces this at the storage level.
// Redis setNX is the fast-path that prevents even attempting a duplicate write.
// A duplicate returns { accepted: true, duplicate: true, pointsAwarded: 0 }
// without storing a new record.
model Event {
  eventId       String    @id
  userId        String
  provider      String
  eventType     EventType
  entityId      String
  rawPayload    Json
  pointsAwarded Int       @default(0)
  capReached    Boolean   @default(false)
  timestamp     DateTime
  processedAt   DateTime?
  createdAt     DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, eventType, timestamp])
  @@index([userId, timestamp])
}

enum EventType {
  LEAD_CONTACTED
  MEETING_COMPLETED
  STAGE_ADVANCED
  DEAL_WON
  DEAL_LOST
}

// ─── Scoring Configuration — DB-driven, seeded from scoring-config.json ──────

model ScoringRule {
  id        String    @id @default(uuid())
  eventType EventType @unique
  points    Int
  isActive  Boolean   @default(true)
  updatedAt DateTime  @updatedAt
}

// Level 1 = Rookie, 2 = Closer, 3 = Elite, 4 = Legend
// Seeded from config. View-only in POC. Edit endpoint in MVP.
model LevelConfig {
  level     Int      @id
  minXP     Int
  label     String
  updatedAt DateTime @updatedAt
}

model DailyCapConfig {
  id        String    @id @default(uuid())
  eventType EventType @unique
  maxCount  Int
  isActive  Boolean   @default(true)
  updatedAt DateTime  @updatedAt
}

// ─── Gamification State ───────────────────────────────────────────────────────

model UserStats {
  userId           String    @id
  totalXP          Int       @default(0)   // All-time, floors at 0, never resets
  totalPoints      Int       @default(0)   // All-time cumulative
  level            Int       @default(1)
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastActivityDate DateTime?               // DATE precision for streak calc
  updatedAt        DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id])
}

// One row per user per ISO week. Never deleted. Leaderboard reads this directly.
model WeeklyStat {
  id         String   @id @default(uuid())
  userId     String
  isoWeek    String                        // 'YYYY-Www'
  weekPoints Int      @default(0)
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, isoWeek])
  @@index([isoWeek, weekPoints])           // Leaderboard query index
}

model DailyCap {
  id        String    @id @default(uuid())
  userId    String
  eventType EventType
  date      DateTime  @db.Date
  count     Int       @default(0)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, eventType, date])
}

// ─── Badges ───────────────────────────────────────────────────────────────────

model BadgeAward {
  id        String    @id @default(uuid())
  userId    String
  badgeType BadgeType
  awardedAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, badgeType])
}

// targetCount is denormalised so the frontend can render progress %
// without knowing badge rules.
model BadgeProgress {
  id           String    @id @default(uuid())
  userId       String
  badgeType    BadgeType
  currentCount Int       @default(0)
  targetCount  Int
  weekKey      String?                     // ISO week for time-windowed, null for lifetime
  isCompleted  Boolean   @default(false)
  updatedAt    DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, badgeType, weekKey])
}

enum BadgeType {
  FIRST_WIN
  CONSISTENT_CLOSER
  PIPELINE_BUILDER
  HOT_STREAK
  TOP_OF_THE_WEEK
  COMEBACK_KID
}

// ─── Award Timeline ───────────────────────────────────────────────────────────

model AwardTimeline {
  id             String            @id @default(uuid())
  userId         String
  type           TimelineEventType
  badgeType      BadgeType?
  eventId        String?           // Which event triggered it (null for cron awards)
  pointsSnapshot Int
  xpSnapshot     Int
  levelSnapshot  Int
  weekKey        String?
  metadata       Json?
  createdAt      DateTime          @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

enum TimelineEventType {
  BADGE_EARNED
  LEVEL_UP
  STREAK_MILESTONE
  WEEKLY_TOP_3
  PERSONAL_BEST_WEEK
}

// ─── Notifications ────────────────────────────────────────────────────────────

model NotificationLog {
  id       String   @id @default(uuid())
  userId   String
  type     String
  channel  String   @default("email")
  sentAt   DateTime @default(now())
  metadata Json?

  user User @relation(fields: [userId], references: [id])

  @@index([userId, type, sentAt])
}
```

### Key Design Decisions

**`Event.eventId` as PK** — the external CRM event ID is the primary key. Postgres prevents
duplicate inserts at the storage level. Redis `setNX` is the performance fast-path, not
the correctness guarantee. On Redis TTL expiry, Prisma throws `P2002` (unique constraint
violation) which is caught and returns the correct duplicate response.

**`WeeklyStat` materialised** — updated inside every scoring transaction. Leaderboard reads
are index scans on `(isoWeek, weekPoints)`. No aggregation at query time.

**`ScoringRule` / `LevelConfig` / `DailyCapConfig` DB-driven** — seeded from
`scoring-config.json` on first run. Managers view current rules via `/admin/rules`.
Edit endpoints are MVP scope.

**`BadgeProgress.targetCount` denormalised** — `currentCount / targetCount * 100` gives
progress percentage without the frontend needing to know badge rules.

**`AwardTimeline` separate from `BadgeAward`** — `BadgeAward` is the access control record.
`AwardTimeline` is the narrative context. Mixing them couples two different query patterns.

**`totalXP` and `totalPoints` never reset** — two independent axes. XP floors at 0.
The leaderboard uses `weekPoints` from `WeeklyStat`. A rep can have a bad week and still
hold their level.

---

## 6. Architecture & Request Lifecycle

### Two Ingestion Paths

**Path A — Direct canonical ingestion (`POST /events`)**

Used by the event simulator, direct API consumers, and tests.

```
POST /events
  → JwtGuard + RolesGuard
  → ValidationPipe (class-validator DTO)
  → Validate userId exists
  → ScoringService.processEvent()
      → Redis setNX dedup fast-path
      → Prisma transaction (score + badge + timeline)
      → Invalidate caches
      → notification-queue.add() if badge/level-up
  → Return 200 with points, totals, badges unlocked
```

**Path B — CRM webhook ingestion (`POST /webhooks/:provider`)**

Used by live CRM integrations. Must respond within provider timeout windows.

```
POST /webhooks/:provider
  → WebhookGuard
      → select adapter by provider slug
      → read raw body as Buffer (before JSON parse)
      → adapter.verifySignature(req) — provider-specific HMAC
      → reject 401 if invalid, no error detail leaked
  → adapter.extractRawEvents(body) → always an array
  → for each raw event:
      ingestion-queue.add('raw-event', { provider, raw })
  → return 202 { queued: n }   ← responds before any processing

ingestion-queue worker:
  → adapter.resolveUserId(raw)
  → adapter.normalizeEvent(raw, userId) → CanonicalEvent
  → ScoringService.processEvent()
  → notification-queue.add() if badge/level-up
```

### Why Path A Scores Synchronously

The spec requires `pointsAwarded` and current user totals in the `POST /events` response.
Async scoring requires polling or WebSocket push — added complexity for no benefit here.
Synchronous scoring inside a transaction is < 50ms under normal load and gives the correct
response immediately. The event simulator depends on this — the rep sees their result inline.

### NestJS Module Map

```
AppModule
  ├── PrismaModule         (global)
  ├── CacheModule          (global — RedisAdapter)
  ├── ConfigModule         (global — Zod-validated env)
  ├── AuthModule
  ├── UsersModule
  ├── EventsModule         → ScoringModule, QueuesModule
  ├── WebhooksModule       → QueuesModule (ingestion-queue)
  ├── ScoringModule        → BadgesModule, CacheModule
  ├── BadgesModule
  ├── LeaderboardModule    → CacheModule
  ├── NotificationsModule
  ├── QueuesModule         → BullMQModule
  └── HealthModule
```

---

## 7. CRM Integration Layer

### CrmAdapter Interface

```typescript
export interface CrmAdapter {
  // Verify provider-specific HMAC. Raw body must be Buffer.
  verifySignature(req: RawRequest): Promise<boolean>

  // Extract individual events. Always returns an array.
  // HubSpot: body is already an array (up to 100).
  // Pipedrive: single object, wrapped in array.
  // Generic: single or array, both handled.
  extractRawEvents(body: unknown): unknown[]

  // Normalise one raw event into canonical shape.
  normalizeEvent(raw: unknown, resolvedUserId: string): CanonicalEvent

  // Resolve CRM-native identifier to internal userId.
  resolveUserId(raw: unknown): Promise<string>
}
```

### Signature Verification — Provider Detail

**Generic (fully implemented):**
```
1. Reject if X-Webhook-Timestamp older than 5 minutes (replay protection)
2. Compute HMAC-SHA256(secret, timestamp + "." + rawBody)
3. Hex encode
4. Compare with X-Webhook-Signature using crypto.timingSafeEqual
5. Return 401 on failure — no detail leaked
```

**HubSpot v3 (signature logic implemented, owner resolution stubbed):**
```
1. Reject if X-HubSpot-Request-Timestamp older than 5 minutes
2. Compute HMAC-SHA256(secret, method + uri + rawBody + timestamp)
3. Base64 encode
4. Compare with X-HubSpot-Signature-v3 using crypto.timingSafeEqual

resolveUserId: documented stub
  → GET /crm/v3/objects/deals/{objectId}?properties=hubspot_owner_id
  → extract hubspot_owner_id
  → lookup CrmUserMap WHERE provider='hubspot' AND externalId=ownerId
  Requires live HubSpot credentials — not executable in POC
```

**Pipedrive (MVP):**
```
Signature: HMAC-SHA256(secret, rawBody), hex, X-Pipedrive-Signature
resolveUserId: raw.meta.user_id → CrmUserMap lookup (straightforward)
```

### Provider Comparison

| | Generic | HubSpot | Pipedrive |
|---|---|---|---|
| POC status | ✅ Full | ✅ Signature + normalise | 🔲 MVP |
| Payload | Single or array | JSON array up to 100 | JSON single object |
| User identity | `userId` field | ❌ Not in payload | ✅ `meta.user_id` |
| Resolve user | Direct Users lookup | HubSpot API call (stubbed) | CrmUserMap lookup |
| Replay protection | Timestamp ±5 min | Timestamp ±5 min | None |
| CRM retry window | Caller-dependent | Up to 10× / 24h | On failure |
| Provider timeout | None | 5 seconds | None documented |

---

## 8. Queue Architecture

### Three Queues

```
ingestion-queue
  Job:     RawEventJob { provider, raw }
  Workers: 10
  Retries: 5, exponential backoff from 2s
  Limiter: 10 jobs/second (HubSpot API rate respect)
  On exhaustion: dead-letter
  Purpose: CRM adapter resolution, normalisation, then
           calls ScoringService synchronously

notification-queue
  Job:     NotificationJob { userId, type, data }
  Workers: 3
  Retries: 5, exponential backoff
  Purpose: Resend email, NotificationLog write
           Gracefully skipped if RESEND_API_KEY not set

scheduled-queue  (BullMQ cron)
  StreakRiskCheck     '0 18 * * *'    daily 18:00   ← implemented
  WeeklyRepDigest     '0 8 * * 1'    Monday 08:00  ← MVP
  WeeklyMgrDigest     '0 8 * * 1'    Monday 08:00  ← MVP
  EndOfWeekPush       '0 16 * * 5'   Friday 16:00  ← MVP
  WeeklyWrapup        '0 23 * * 0'   Sunday 23:00  ← MVP
  TopOfWeekAward      '30 23 * * 0'  Sunday 23:30  ← MVP
```

### Dead-Letter Queue

Jobs exhausting all retries land in BullMQ failed sets with full error context (internal ops only; no HTTP list/retry API in POC).

### Startup Warning — Resend

```typescript
// NotificationsService — OnModuleInit
onModuleInit() {
  if (!this.configService.get<string>('RESEND_API_KEY')) {
    this.logger.warn(
      'RESEND_API_KEY not configured — email notifications disabled. ' +
      'Set RESEND_API_KEY in .env to enable.'
    )
    this.emailEnabled = false
  }
}

async sendEmail(to: string, template: EmailTemplate): Promise<void> {
  if (!this.emailEnabled) {
    this.logger.debug({ to, template: template.type }, 'Email skipped — no API key')
    return
  }
  await this.resend.emails.send({ ... })
}
```

No silent failures. No broken local dev. The notification log is still written so the
audit trail is intact even when email is disabled.

---

## 9. Transaction Boundaries

### Transaction 1 — Core Scoring

Every scored event runs this transaction. All writes succeed or all roll back.

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. Write immutable event record
  await tx.event.create({ data: { ...event, pointsAwarded, capReached } })

  // 2. Upsert UserStats — streak, XP, level
  const stats = await tx.userStats.upsert({
    where:  { userId },
    create: { userId, totalXP: xp, totalPoints: points, level, ...streakFields },
    update: { totalXP: xp, totalPoints: points, level, ...streakFields },
  })
  // SELECT FOR UPDATE on UserStats row — serialises concurrent events per user
  // Production evolution: optimistic concurrency at high per-user throughput

  // 3. Upsert WeeklyStat
  await tx.weeklyStat.upsert({
    where:  { userId_isoWeek: { userId, isoWeek } },
    create: { userId, isoWeek, weekPoints: pointsAwarded },
    update: { weekPoints: { increment: pointsAwarded } },
  })

  // 4. Upsert DailyCap
  await tx.dailyCap.upsert({
    where:  { userId_eventType_date: { userId, eventType, date: today } },
    create: { userId, eventType, date: today, count: 1 },
    update: { count: { increment: 1 } },
  })

  // 5. Badge evaluation — upsert BadgeProgress, write BadgeAward if unlocked
  const badgeResults = await this.badgeService.evaluate(tx, userId, eventType, isoWeek)

  // 6. Award timeline entries
  await this.timelineService.record(tx, userId, stats, badgeResults, eventId)

  return { stats, badgeResults }
})

// After commit — cache invalidation + async notifications
await this.cache.del(`leaderboard:${isoWeek}`)
await this.cache.del(`leaderboard:all-time`)
for (const badge of badgeResults.unlocked) {
  await this.notificationQueue.add('BADGE_UNLOCK', { userId, badge })
}
```

### Transaction 2 — Streak Reset (cron)

```typescript
await this.prisma.$transaction([
  this.prisma.userStats.update({
    where: { userId },
    data:  { currentStreak: 0, lastActivityDate: null }
  }),
  this.prisma.notificationLog.create({
    data: { userId, type: 'STREAK_BROKEN' }
  }),
])
// + notification-queue.add('STREAK_BROKEN')
```

### Transaction 3 — Top of Week Award (Sunday cron, MVP)

```typescript
await this.prisma.$transaction(async (tx) => {
  const top = await tx.weeklyStat.findFirst({
    where:   { isoWeek },
    orderBy: [{ weekPoints: 'desc' }, { userId: 'asc' }],
  })
  await tx.badgeAward.create({ data: { userId: top.userId, badgeType: 'TOP_OF_THE_WEEK' } })
  // Unique constraint prevents double-award on concurrent cron runs
  await tx.awardTimeline.create({ ... })
})
```

### Transaction 4 — Seed Script

The entire seed runs in a single transaction. Partial seeds are a testing liability.

---

## 10. Scoring Engine

### Full Flow

```typescript
async processEvent(dto: CreateEventDto, actorUserId: string): Promise<EventResult> {

  // 1. Validate user exists
  const user = await this.usersService.findOrThrow(dto.userId)

  // 2. Redis dedup fast-path
  const alreadyProcessed = await this.dedup.isProcessed(dto.eventId)
  if (alreadyProcessed) {
    return { accepted: true, duplicate: true, pointsAwarded: 0 }
  }

  // 3. Load rules from cache (Redis, 5min TTL, seeded from DB)
  const rules = await this.scoringConfigCache.get()

  // 4. Daily cap check
  const capConfig = rules.dailyCaps[dto.eventType]
  const todayCount = await this.getDailyCount(dto.userId, dto.eventType)
  const capReached  = capConfig?.isActive && todayCount >= capConfig.maxCount
  const basePoints  = rules.pointRules[dto.eventType] ?? 0
  const pointsAwarded = capReached ? 0 : basePoints

  // 5. Compute new XP and level (pure, in-memory)
  const currentStats = await this.usersService.getStats(dto.userId)
  const newXP    = Math.max(0, (currentStats?.totalXP ?? 0) + pointsAwarded)
  const newLevel = this.deriveLevel(newXP, rules.levels)
  const levelUp  = newLevel > (currentStats?.level ?? 1)

  // 6. Streak computation (pure function, no DB call)
  const streakUpdate = computeStreakUpdate(currentStats, dto.timestamp)

  // 7. Prisma transaction
  const { stats, badgeResults } = await this.runScoringTransaction(
    dto, pointsAwarded, capReached, newXP, newLevel, streakUpdate
  )

  // 8. Cache invalidation
  await this.cache.del(`leaderboard:${getIsoWeek(dto.timestamp)}`)
  await this.cache.del('leaderboard:all-time')

  // 9. Async notifications
  if (levelUp) {
    await this.notificationQueue.add('LEVEL_UP', { userId: dto.userId, level: newLevel })
  }
  for (const badge of badgeResults.unlocked) {
    await this.notificationQueue.add('BADGE_UNLOCK', { userId: dto.userId, badge })
  }

  return this.buildResult(dto, pointsAwarded, capReached, stats, badgeResults)
}
```

### Level Derivation — Pure Function

```typescript
function deriveLevel(xp: number, levels: LevelConfig[]): number {
  return [...levels]
    .sort((a, b) => b.minXP - a.minXP)
    .find(l => xp >= l.minXP)?.level ?? 1
}
```

Deterministic. Config-driven. No magic numbers in application code.

### Default Level Config (seeded from JSON)

| Level | Min XP | Label |
|---|---|---|
| 1 | 0 | Rookie |
| 2 | 100 | Closer |
| 3 | 250 | Elite |
| 4 | 500 | Legend |

---

## 11. Anti-Gaming Rules

### Required Rules (Spec — Both Implemented)

**Rule 1 — Idempotency**

Duplicate `eventId` returns the correct duplicate response without storing a new record.

```
Layer 1 — Redis setNX fast-path:
  isProcessed(eventId) → true → return immediately, no DB write

Layer 2 — Postgres PK hard guarantee:
  On Redis TTL expiry (edge case), Event.create throws P2002
  → catch UniqueConstraintViolation → return duplicate response

Response:
{
  "accepted": true,
  "duplicate": true,
  "pointsAwarded": 0,
  "reason": "Duplicate eventId — already processed"
}
```

**Rule 2 — Daily Cap**

`LEAD_CONTACTED` events beyond the daily limit are accepted, stored with `capReached: true`,
and score zero. The rep sees exactly why they got zero points.

```
Response when cap reached:
{
  "accepted": true,
  "duplicate": false,
  "capReached": true,
  "pointsAwarded": 0,
  "reason": "Daily cap reached for LEAD_CONTACTED (5/5)"
}
```

### Extensible Anti-Gaming Engine

Additional rules are pluggable without schema changes:

```typescript
interface AntiGamingRule {
  name:     string
  applies:  (eventType: EventType) => boolean
  evaluate: (dto: CanonicalEvent, userId: string) => Promise<{ blocked: boolean; reason?: string }>
}

// Registered rules — evaluated in order, first block wins
const ANTI_GAMING_RULES: AntiGamingRule[] = [
  new DailyCapRule(),           // ← spec required, implemented
  new HourlyVelocityRule(),     // ← designed, not implemented: max N same-type/hour
  new DuplicateEntityRule(),    // ← designed, not implemented: max N contacts/entity/day
]
```

`HourlyVelocityRule` and `DuplicateEntityRule` are documented as designed patterns.
They are not implemented in this POC but the interface is there to add them cleanly.

---

## 12. Badge System

### Badge Definitions — Typed Objects, Code-Level

```typescript
interface BadgeDefinition {
  type:        BadgeType
  displayName: string
  description: string
  iconUrl:     string
  targetCount: number
  windowType:  'lifetime' | 'iso_week'
  eventTypes:  EventType[]
  evaluate:    (progress: BadgeProgress) => boolean
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type:        BadgeType.FIRST_WIN,
    displayName: 'First Win',
    description: 'Close your first deal.',
    iconUrl:     '/badges/first-win.svg',
    targetCount: 1,
    windowType:  'lifetime',
    eventTypes:  [EventType.DEAL_WON],
    evaluate:    p => p.currentCount >= 1,
  },
  {
    type:        BadgeType.CONSISTENT_CLOSER,
    displayName: 'Consistent Closer',
    description: 'Close 3 deals in a single week.',
    iconUrl:     '/badges/consistent-closer.svg',
    targetCount: 3,
    windowType:  'iso_week',
    eventTypes:  [EventType.DEAL_WON],
    evaluate:    p => p.currentCount >= 3,
  },
  {
    type:        BadgeType.PIPELINE_BUILDER,
    displayName: 'Pipeline Builder',
    description: 'Advance 5 deals through stages in a single week.',
    iconUrl:     '/badges/pipeline-builder.svg',
    targetCount: 5,
    windowType:  'iso_week',
    eventTypes:  [EventType.STAGE_ADVANCED],
    evaluate:    p => p.currentCount >= 5,
  },
  {
    type:        BadgeType.HOT_STREAK,
    displayName: 'Hot Streak',
    description: 'Log activity 5 days in a row.',
    iconUrl:     '/badges/hot-streak.svg',
    targetCount: 5,
    windowType:  'lifetime',
    eventTypes:  [],              // evaluated via streak field
    evaluate:    p => p.currentCount >= 5,
  },
  {
    type:        BadgeType.TOP_OF_THE_WEEK,
    displayName: 'Top of the Week',
    description: 'Finish #1 on the leaderboard at end of week.',
    iconUrl:     '/badges/top-of-week.svg',
    targetCount: 1,
    windowType:  'iso_week',
    eventTypes:  [],              // awarded by Sunday cron — MVP
    evaluate:    p => p.currentCount >= 1,
  },
  {
    type:        BadgeType.COMEBACK_KID,
    displayName: 'Comeback Kid',
    description: 'Bounce back with a better week after a down week.',
    iconUrl:     '/badges/comeback-kid.svg',
    targetCount: 1,
    windowType:  'iso_week',
    eventTypes:  [],              // awarded by Sunday cron — MVP
    evaluate:    p => p.currentCount >= 1,
  },
]
```

### Badge Evaluation (inside Transaction 1)

```typescript
async evaluate(tx, userId, eventType, isoWeek): Promise<BadgeResult> {
  const relevant   = BADGE_DEFINITIONS.filter(d => d.eventTypes.includes(eventType))
  const earned     = await tx.badgeAward.findMany({ where: { userId } })
  const earnedSet  = new Set(earned.map(b => b.badgeType))
  const unlocked: BadgeType[] = []

  for (const def of relevant) {
    if (earnedSet.has(def.type)) continue

    const weekKey  = def.windowType === 'iso_week' ? isoWeek : null
    const progress = await tx.badgeProgress.upsert({
      where:  { userId_badgeType_weekKey: { userId, badgeType: def.type, weekKey } },
      create: { userId, badgeType: def.type, currentCount: 1,
                targetCount: def.targetCount, weekKey },
      update: { currentCount: { increment: 1 } },
    })

    if (def.evaluate(progress)) {
      await tx.badgeAward.create({ data: { userId, badgeType: def.type } })
      await tx.badgeProgress.update({
        where: { id: progress.id },
        data:  { isCompleted: true },
      })
      unlocked.push(def.type)
    }
  }

  return { unlocked }
}
```

### Badge Progress API Shape

```json
{
  "badges": {
    "earned": [
      {
        "type": "FIRST_WIN",
        "displayName": "First Win",
        "iconUrl": "/badges/first-win.svg",
        "awardedAt": "2025-05-12T14:23:00Z"
      }
    ],
    "inProgress": [
      {
        "type": "CONSISTENT_CLOSER",
        "displayName": "Consistent Closer",
        "iconUrl": "/badges/consistent-closer.svg",
        "currentCount": 2,
        "targetCount": 3,
        "progressPercent": 67,
        "weekKey": "2025-W21"
      }
    ]
  }
}
```

---

## 13. Streak Logic

### Fields on UserStats

```
currentStreak      INT    consecutive active days
longestStreak      INT    all-time personal best
lastActivityDate   DATE   date of most recent non-zero-point event
```

### Pure Streak Computation

```typescript
function computeStreakUpdate(
  stats: UserStats | null,
  eventDate: Date
): Partial<UserStats> {
  const today = toDateOnly(eventDate)
  const last  = stats?.lastActivityDate ? toDateOnly(stats.lastActivityDate) : null

  if (last && isSameDay(last, today))  return {}   // already active today

  if (last && isYesterday(last, today)) {
    const next = (stats?.currentStreak ?? 0) + 1
    return {
      currentStreak:    next,
      longestStreak:    Math.max(stats?.longestStreak ?? 0, next),
      lastActivityDate: today,
    }
  }

  // Gap or first ever activity
  return {
    currentStreak:    1,
    longestStreak:    Math.max(stats?.longestStreak ?? 0, 1),
    lastActivityDate: today,
  }
}
```

Streak only advances on events that award points. Capped and duplicate events do not
extend the streak.

### Streak Risk Cron (18:00 daily — implemented)

```typescript
async streakRiskCheck(): Promise<void> {
  const yesterday = subDays(startOfDay(new Date()), 1)
  const atRisk = await this.prisma.userStats.findMany({
    where: {
      lastActivityDate: { gte: yesterday, lt: startOfDay(new Date()) },
      currentStreak: { gte: 2 },
    },
    include: { user: true },
  })

  for (const stats of atRisk) {
    const alreadySent = await this.notificationLog.existsToday(
      stats.userId, 'STREAK_RISK'
    )
    if (!alreadySent) {
      await this.notificationQueue.add('STREAK_RISK', {
        userId: stats.userId,
        streak: stats.currentStreak,
      })
    }
  }
}
```

### Streak Milestone Timeline Entries

Written inside Transaction 1 at thresholds 3, 7, 14, 30:

```typescript
const STREAK_MILESTONES = [3, 7, 14, 30]
if (STREAK_MILESTONES.includes(newStreak)) {
  await tx.awardTimeline.create({
    data: {
      userId, type: TimelineEventType.STREAK_MILESTONE,
      xpSnapshot: newXP, pointsSnapshot: newPoints, levelSnapshot: newLevel,
      metadata: { streak: newStreak },
    },
  })
}
```

---

## 14. Award Timeline

### Purpose

`AwardTimeline` is the narrative layer. `BadgeAward` answers "does this user own this
badge?" — `AwardTimeline` answers "what happened, when, and in what context?"

Enables:
- Rep profile achievement feed with dates and context
- Context-aware emails: "You earned Consistent Closer at Level 3 on May 22nd"
- Manager quarter reviews with rep achievement history
- Personal best detection

### Entry Types

| Type | When Written | Key Metadata |
|---|---|---|
| `BADGE_EARNED` | Badge unlocked in transaction | badgeType, eventId |
| `LEVEL_UP` | Level increases in transaction | `{ from, to }` |
| `STREAK_MILESTONE` | Streak hits 3/7/14/30 | `{ streak }` |
| `WEEKLY_TOP_3` | Sunday cron — MVP | `{ rank }` |
| `PERSONAL_BEST_WEEK` | Sunday cron — MVP | `{ weekPoints }` |

---

## 15. Leaderboard

### Query Strategy

`WeeklyStat` is materialised inside every scoring transaction.
Leaderboard reads are index scans on `@@index([isoWeek, weekPoints])` — no aggregation.

### Response Shape

```json
{
  "week": "2025-W21",
  "generatedAt": "2025-05-26T10:00:00Z",
  "fromCache": true,
  "entries": [
    {
      "rank": 1,
      "userId": "uuid-alice",
      "name": "Alice Smith",
      "weekPoints": 340,
      "totalXP": 820,
      "level": 4,
      "levelLabel": "Legend",
      "currentStreak": 7,
      "pointsGap": 0,
      "badges": [
        {
          "type": "FIRST_WIN",
          "displayName": "First Win",
          "iconUrl": "/badges/first-win.svg"
        }
      ]
    },
    {
      "rank": 2,
      "userId": "uuid-diana",
      "name": "Diana Osei",
      "weekPoints": 280,
      "totalXP": 610,
      "level": 3,
      "levelLabel": "Elite",
      "currentStreak": 4,
      "pointsGap": 60,
      "badges": []
    }
  ]
}
```

`pointsGap` — points behind the rank above. Rank 1 always `pointsGap: 0`.
Tie-break: `weekPoints DESC`, then `userId ASC` (deterministic, testable).

### Redis Caching

```
Key: leaderboard:{isoWeek}       TTL: 60s
Key: leaderboard:all-time        TTL: 60s
Invalidated: on every scoring transaction commit
```

---

## 16. Notification System

### Design Rule

All email flows through `NotificationsService`. Queue processors never call Resend
directly. `NotificationLog` is written even when email is disabled — audit trail is
always intact.

### POC — Implemented

| Type | Trigger | Channel |
|---|---|---|
| `BADGE_UNLOCK` | Badge awarded | Email via Resend |
| `STREAK_RISK` | Cron 18:00, no activity today | Email via Resend |

### MVP — Scaffolded

| Type | Trigger |
|---|---|
| `LEVEL_UP` | Level increases |
| `NEAR_BADGE` | Progress ≥ 80% |
| `STREAK_BROKEN` | Streak resets |
| `WEEKLY_REP_DIGEST` | Monday 08:00 cron |
| `WEEKLY_MGR_DIGEST` | Monday 08:00 cron |
| `END_OF_WEEK_PUSH` | Friday 16:00 cron |
| `TOP_OF_WEEK_AWARD` | Sunday 23:30 cron |

---

## 17. Cache & Deduplication Adapters

### CacheAdapter Interface

Business logic calls the interface. The Redis implementation is the default. A future
in-memory implementation (for testing without Redis) implements the same interface.

```typescript
export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  setNX(key: string, ttlSeconds: number): Promise<boolean>
  // setNX returns true if key was set (new), false if already existed (duplicate)
}

@Injectable()
export class RedisCacheAdapter implements CacheAdapter {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key)
    return val ? JSON.parse(val) : null
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async setNX(key: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }
}
```

### DeduplicationService

Wraps `CacheAdapter.setNX` with a domain-specific interface:

```typescript
@Injectable()
export class DeduplicationService {
  constructor(private readonly cache: CacheAdapter) {}

  async isProcessed(eventId: string, provider = 'generic'): Promise<boolean> {
    const key = `dedup:${provider}:${eventId}`
    const isNew = await this.cache.setNX(key, 86400)  // 24h TTL
    return !isNew   // isNew=true means first time; isNew=false means duplicate
  }
}
```

### Redis Usage Summary

| Purpose | Key Pattern | TTL | Notes |
|---|---|---|---|
| BullMQ backing store | (managed by BullMQ) | — | Queues, jobs, cron state |
| Leaderboard cache | `leaderboard:{isoWeek}` | 60s | Invalidated on scoring |
| All-time leaderboard | `leaderboard:all-time` | 60s | Invalidated on scoring |
| Scoring config cache | `scoring-config` | 5min | Invalidated on rule update |
| Event deduplication | `dedup:{provider}:{eventId}` | 24h | Fast-path before DB write |
| ~~User stats cache~~ | — | — | Dropped — premature optimisation |
| ~~Distributed lock~~ | — | — | Dropped — `SELECT FOR UPDATE` sufficient |

---

## 18. Authentication & Security

### JWT Auth

- `POST /auth/login` → validates credentials → returns signed JWT (8h)
- `JwtStrategy` validates token on all protected routes
- `RolesGuard` enforces `@Roles(Role.MANAGER)` on manager-only endpoints
- `@CurrentUser()` decorator injects authenticated user into controllers
- Frontend stores JWT in HTTP-only cookie via NextAuth.js credentials provider
- Seeded accounts only — no public registration endpoint

### Role Enum

```typescript
enum Role {
  SALES_REP   // formerly REP — renamed throughout
  MANAGER
}
```

### Role-Based Access

| Endpoint | SALES_REP | MANAGER |
|---|---|---|
| `POST /events` | ✅ own userId only | ✅ any userId |
| `GET /users/:userId` | ✅ own only | ✅ any |
| `GET /users/:userId/timeline` | ✅ own only | ✅ any |
| `GET /leaderboard` | ✅ | ✅ |
| `GET /leaderboard/all-time` | ✅ | ✅ |
| `GET /events` (audit log) | ✅ own only | ✅ all with filters |
| `GET /admin/rules` | ❌ 403 | ✅ |
| `GET /admin/overview` | ❌ 403 | ✅ |
| `GET /admin/reps` | ❌ 403 | ✅ |
| `POST /webhooks/:provider` | public (HMAC-guarded) | public (HMAC-guarded) |

### Webhook Security

```typescript
@Injectable()
export class WebhookGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req      = context.switchToHttp().getRequest<RawRequest>()
    const provider = req.params.provider
    const adapter  = this.adapterFactory.get(provider)

    if (!adapter) throw new NotFoundException(`Unknown provider: ${provider}`)

    const valid = await adapter.verifySignature(req)
    if (!valid) {
      this.logger.warn({ provider, ip: req.ip }, 'Webhook signature verification failed')
      throw new UnauthorizedException()  // No detail — don't leak which check failed
    }

    return true
  }
}
```

NestJS raw body middleware must be configured before the guard runs — JSON body parsing
must happen after signature verification:

```typescript
// main.ts
app.use('/webhooks', rawBodyMiddleware())  // Buffer, not parsed JSON
app.use(express.json())                   // Everything else parsed normally
```

### Additional Security

- `helmet()` — HTTP security headers globally
- `@nestjs/throttler` — rate limiting on `/webhooks/*` (100 req/min per IP, configurable)
- `crypto.timingSafeEqual` — all HMAC comparisons
- Webhook secrets in environment variables per provider
- Zod validation of all env vars on startup — fast fail on misconfiguration
- `rawPayload` stored for debugging — never exposed in API responses

---

## 19. API Contract

Full Swagger documentation at `/api/docs`. Auto-generated from `@nestjs/swagger`
decorators. Every endpoint includes request schema, all response shapes, and all error
codes.

### POST /events

```
POST /events
Authorization: Bearer <token>

Body:
{
  "eventId":   "evt-001",
  "userId":    "uuid-alice",
  "eventType": "DEAL_WON",
  "entityId":  "deal-999",
  "timestamp": "2025-05-22T10:00:00Z",
  "metadata":  {}
}

Response 200 — scored:
{
  "eventId":        "evt-001",
  "accepted":       true,
  "duplicate":      false,
  "capReached":     false,
  "pointsAwarded":  100,
  "user": {
    "totalXP":      420,
    "level":        3,
    "levelLabel":   "Elite",
    "currentStreak": 5
  },
  "badgesUnlocked": [
    {
      "type":        "FIRST_WIN",
      "displayName": "First Win",
      "iconUrl":     "/badges/first-win.svg"
    }
  ]
}

Response 200 — duplicate:
{
  "eventId":       "evt-001",
  "accepted":      true,
  "duplicate":     true,
  "pointsAwarded": 0,
  "reason":        "Duplicate eventId — already processed"
}

Response 200 — cap reached:
{
  "eventId":       "evt-007",
  "accepted":      true,
  "duplicate":     false,
  "capReached":    true,
  "pointsAwarded": 0,
  "reason":        "Daily cap reached for LEAD_CONTACTED (5/5)"
}

Response 400: validation error
Response 401: missing/invalid token
Response 404: userId not found
```

### POST /webhooks/:provider

```
POST /webhooks/generic
POST /webhooks/hubspot
Headers (generic):
  X-Webhook-Signature: <hmac-hex>
  X-Webhook-Timestamp: <unix-ms>

Response 202:
{ "queued": 3 }

Response 401: invalid signature
Response 404: unknown provider
```

### GET /users/:userId

```
GET /users/:userId
Authorization: Bearer <token>

Response 200:
{
  "userId": "uuid-alice",
  "name": "Alice Smith",
  "email": "alice@demo.com",
  "role": "SALES_REP",
  "stats": {
    "totalXP": 820,
    "totalPoints": 820,
    "level": 4,
    "levelLabel": "Legend",
    "currentStreak": 7,
    "longestStreak": 12
  },
  "badges": { "earned": [...], "inProgress": [...] }
}
```

### GET /leaderboard

```
GET /leaderboard?week=2025-W21
GET /leaderboard/all-time
Authorization: Bearer <token>

Response 200: (see Section 15 for full shape)
```

### GET /users/:userId/timeline

```
GET /users/:userId/timeline?limit=20&offset=0
Authorization: Bearer <token>

Response 200:
{
  "timeline": [
    {
      "type": "BADGE_EARNED",
      "badgeType": "CONSISTENT_CLOSER",
      "displayName": "Consistent Closer",
      "iconUrl": "/badges/consistent-closer.svg",
      "xpSnapshot": 420,
      "levelSnapshot": 3,
      "weekKey": "2025-W21",
      "createdAt": "2025-05-22T11:30:00Z"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

### GET /events (audit log)

```
GET /events?userId=uuid-alice&from=2025-05-01&to=2025-05-31&limit=50
Authorization: Bearer <token>

Response 200:
{
  "events": [...],
  "total": 87,
  "limit": 50,
  "offset": 0
}
```

### GET /admin/rules

```
GET /admin/rules
Authorization: Bearer <manager-token>

Response 200:
{
  "scoringRules": [
    { "eventType": "LEAD_CONTACTED", "points": 10, "isActive": true }
  ],
  "dailyCapRules": [
    { "eventType": "LEAD_CONTACTED", "maxCount": 5, "isActive": true }
  ],
  "levelConfig": [
    { "level": 1, "minXP": 0,   "label": "Rookie"  },
    { "level": 2, "minXP": 100, "label": "Closer"  },
    { "level": 3, "minXP": 250, "label": "Elite"   },
    { "level": 4, "minXP": 500, "label": "Legend"  }
  ],
  "badges": [
    {
      "type": "FIRST_WIN",
      "displayName": "First Win",
      "description": "Close your first deal.",
      "iconUrl": "/badges/first-win.svg",
      "targetCount": 1,
      "windowType": "lifetime"
    }
  ]
}
```

### GET /health

```
GET /health

Response 200:
{
  "status": "ok",
  "info": {
    "postgres": { "status": "up" },
    "redis":    { "status": "up" }
  }
}
```

---

## 20. Frontend

### Login — `/login`

Single form, email + password, NextAuth credentials provider → NestJS JWT.
Redirect to role-appropriate dashboard on success:
- `SALES_REP` → `/dashboard`
- `MANAGER` → `/admin/dashboard`

### Sales Rep — `/dashboard`

**XP + Level card**
- Progress bar: current XP → next level threshold
- Level label ("Elite"), level number, XP to next level shown numerically
- Streak counter with flame icon, "at risk" amber state if no activity today

**Rank card**
- Current week rank, rank movement since Monday (↑3 / ↓1 / —)
- "You are 60 pts behind Diana Osei" — `pointsGap` made human-readable
- Points earned this week

**Badge showcase**
- Earned badges: icon + displayName + award date
- In-progress badges: icon + displayName + progress bar with percentage
- Locked badges: greyed out, visible, description shown on hover

**Timeline feed**
- Last 10 `AwardTimeline` entries
- Badge earned, level up, streak milestone — each with icon and context

**Event Simulator** (slide-out panel, trigger button in header)
- `userId` pre-filled from current user
- `eventType` dropdown
- `entityId` text input (optional, defaults to random)
- Submit → calls `POST /events` → shows inline response
  - Points awarded (green) or 0 with reason (amber)
  - Badge unlocked notification if applicable
  - Level up notification if applicable
- Manager can change userId dropdown to simulate for any rep

### Sales Rep — `/leaderboard`

- Week selector (ISO format, defaults to current week)
- Full ranked table: rank, name, weekPoints, totalXP, level label, streak flame, badge chips
- Own row highlighted and pinned visible
- `pointsGap` column — "60 pts behind"
- Click any rep row → rep profile modal

### Manager — `/admin/dashboard`

- This week's top 3 — visual podium cards with badge chips
- Most improved rep — week-over-week delta
- Reps with zero activity this week — at-risk list
- Quick links to leaderboard, rules, rep roster

### Manager — `/admin/leaderboard`

- Week selector + "All Time" tab
- Same table as rep view plus activity count column
- Click any rep → full rep profile
- Week-over-week toggle

### Manager — `/admin/reps`

- Table: name, level label, totalXP, currentStreak, weekPoints, badge count
- Click → rep profile: full stats, timeline, badge progress, event history

### Manager — `/admin/rules`

- Scoring rules table: event type, points, active toggle (view only in POC)
- Daily cap rules: event type, max count, active (view only)
- Level config: level, minXP, label
- All badge definitions with icon, displayName, description, targetCount, windowType
- "Edit rules" call to action → documented as MVP

### RTK Query Endpoints

```typescript
const gamificationApi = createApi({
  reducerPath: 'gamificationApi',
  tagTypes:    ['UserProfile', 'Leaderboard', 'Timeline', 'Rules', 'Events'],
  endpoints:   builder => ({
    getMyProfile:          builder.query<UserProfile, void>(),
    getRepProfile:         builder.query<UserProfile, string>(),
    getWeeklyLeaderboard:  builder.query<Leaderboard, string>(),
    getAllTimeLeaderboard:  builder.query<Leaderboard, void>(),
    getTimeline:           builder.query<Timeline, TimelineParams>(),
    getEventFeed:          builder.query<EventFeed, FeedParams>(),
    getRules:              builder.query<RulesConfig, void>(),
    getDeadLetter:         builder.query<DeadLetterJob[], void>(),
    retryDeadLetterJob:    builder.mutation<void, string>(),
    getAllReps:             builder.query<RepSummary[], void>(),
    submitEvent:           builder.mutation<EventResult, CreateEventDto>(),
  }),
})
```

---

## 21. UI/UX Design Notes

### Core Principle: Progress Should Always Be Visible

Every number needs context. "420 XP" means nothing. "420 XP — 80 points to Legend" means
everything. Every stat on every screen should answer the implicit question: "so what?"

### Leaderboard

- Own row: highlighted background, sticky/pinned so it's always visible regardless of rank
- `pointsGap`: human-readable — "60 pts behind Diana" not just "60"
- Rank movement: ↑2 (green), ↓1 (red), — (neutral), NEW (first appearance)
- Badge chips on the table: small icon only, tooltip on hover shows displayName
- Streak indicator: flame icon for streaks ≥ 3, number alongside

### Badge Cards

- Locked badges are visible, greyed out, with description — hidden badges create no aspiration
- Progress bars on in-progress badges show both percentage and "2 / 3 this week"
- Earned badges show the award date — "Earned May 12th" — creates a personal history
- Badge icons should be visually distinct — not the same shape in different colours
- HOT_STREAK badge gets a special treatment — animated flame on the earned card

### Event Simulator

- Pre-fills userId from current user — SALES_REP sees their own, MANAGER has a dropdown
- Response appears inline below the form immediately after submit
- Positive points: green badge with points and any badge unlocked
- Zero points with reason: amber, shows exact reason (cap reached / duplicate)
- Badge unlock: brief highlight animation, badge appears in the showcase panel

### Manager Rules Panel

- Show last updated timestamp per rule
- "Edit rules" button present but disabled with tooltip: "Available in next release"
  This is better UX than hiding the button — the manager knows the feature exists
- Projected impact note (design only): "These changes would affect 8 active reps"

### Empty States

- No activity this week: "No activity yet — log your first event to get on the board"
- Past week with no data: "No events recorded for this week"
- No badges yet: "Your badge collection is empty — close your first deal to earn First Win"

### Colour Language

- Level labels have distinct colours: Rookie (grey), Closer (blue), Elite (purple), Legend (gold)
- Positive points: green; negative (deal_lost): muted red; capped: amber
- Streak ≥ 7: flame icon glows; streak at risk: amber pulse on the streak card

---

## 22. Testing Strategy

### Philosophy

Tests read like documentation. Every test description uses the format:
`"given [context], when [action], then [outcome]"`

An engineer unfamiliar with the codebase should understand the business rules by reading
the test descriptions without reading the implementation.

### Unit Tests

| Module | Scenarios |
|---|---|
| `ScoringService` | Points per event type; XP floor at 0; level at each threshold boundary; level label correct; cap: 5th scores, 6th scores 0; capped event has capReached: true |
| `BadgeService` | FIRST_WIN on first deal_won; not awarded twice; CONSISTENT_CLOSER on 3rd deal_won same week; PIPELINE_BUILDER on 5th stage_advanced same week; progress increments correctly; weekKey scoping correct across weeks |
| `StreakService` | Same day → no change; consecutive day → increment; two-day gap → reset; first ever event → streak 1; longestStreak updates; milestone entries at 3, 7, 14, 30 |
| `LeaderboardService` | Sort by weekPoints DESC; tie-break userId ASC; pointsGap correct per rank; rank 1 always 0; all-time uses totalXP |
| `AntiGamingEngine` | DailyCapRule blocks correctly; idempotency via dedup; rule evaluation order |
| `GenericAdapter` | Signature valid; signature invalid; timestamp expired; single event normalised; array normalised; userId resolved |
| `HubSpotAdapter` | HMAC-SHA256 v3 signature valid/invalid; batch of 3 → 3 canonical events; eventType mapping correct |
| `DeduplicationService` | First call → false (new); second call → true (duplicate); TTL argument passed correctly |
| `deriveLevel` | XP 0 → 1; XP 99 → 1; XP 100 → 2; XP 249 → 2; XP 250 → 3; XP 500 → 4; XP 1000 → 4 |
| `computeStreakUpdate` | All four cases; edge: null lastActivityDate |

### Integration Tests (NestJS testing module + test DB)

| Scenario | What's verified |
|---|---|
| Full happy path | Event stored, UserStats updated, WeeklyStat updated, BadgeAward written, NotificationJob enqueued |
| Duplicate eventId | Returns duplicate: true, pointsAwarded: 0, Event count in DB = 1 |
| Daily cap overflow — 6th lead_contacted | 5 score, 6th scores 0, all 6 stored, 6th has capReached: true |
| Concurrent events same user | Both processed correctly, no double-credit (SELECT FOR UPDATE) |
| Leaderboard ordering with ties | Identical weekPoints → sorted by userId ASC |
| Badge not awarded twice | FIRST_WIN awarded once even with 3× deal_won |
| Transaction rollback | Simulated write failure → Event not stored, stats unchanged |
| AwardTimeline entries | LEVEL_UP written on level change; BADGE_EARNED with correct snapshot |
| Streak across days | Consecutive builds; gap resets; milestone at 7 |
| Scoring config cache | Invalidation on rule update; new points on next event |

### E2E Tests (Supertest)

- `POST /events` — valid, duplicate, unknown userId, invalid eventType, missing fields
- `POST /webhooks/generic` — valid signature, invalid signature, expired timestamp
- `GET /leaderboard?week=` — current week, past week, empty week, invalid format
- `GET /leaderboard/all-time` — correct sort by totalXP
- `GET /users/:userId` — own profile (SALES_REP), other rep (MANAGER), other rep (SALES_REP → 403)
- `GET /admin/rules` — MANAGER gets rules, SALES_REP gets 403
- `GET /health` — both services healthy

---

## 23. Docker & Infrastructure

```yaml
# docker-compose.yml
version: '3.9'

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres@db:5432/gamification
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}           # optional — warns if absent
      WEBHOOK_SECRET_GENERIC: ${WEBHOOK_SECRET_GENERIC}
      WEBHOOK_SECRET_HUBSPOT: ${WEBHOOK_SECRET_HUBSPOT}
    depends_on:
      db:    { condition: service_healthy }
      redis: { condition: service_healthy }
    restart: unless-stopped

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXTAUTH_URL: http://localhost:3000
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
    depends_on:
      - api
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gamification
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --appendfsync everysec
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Health checks with `condition: service_healthy`** — API waits for Postgres and Redis
before starting. Prevents failed startup on slow container init.

**Redis AOF** (`--appendonly yes --appendfsync everysec`) — BullMQ jobs survive container
restarts. At most 1 second of job data loss on crash. Better than `always` (performance
cost) and better than no persistence (lost jobs on restart).

### .env.example

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamification
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
NEXTAUTH_SECRET=change-me-in-production
WEBHOOK_SECRET_GENERIC=demo-secret-change-in-production
WEBHOOK_SECRET_HUBSPOT=hubspot-secret-here

# Optional — warnings logged if absent
RESEND_API_KEY=re_xxxx
WEBHOOK_SECRET_PIPEDRIVE=pipedrive-secret-here
```

---

## 24. Seed Data

Script: `api/prisma/seed.ts` — runs in a single transaction, idempotent on re-run.

### Accounts

```
manager@demo.com    Demo1234!   MANAGER
alice@demo.com      Demo1234!   SALES_REP  — consistent performer, W21 leader
bob@demo.com        Demo1234!   SALES_REP  — pipeline specialist
charlie@demo.com    Demo1234!   SALES_REP  — first win this week
diana@demo.com      Demo1234!   SALES_REP  — close #2, chasing Alice
evan@demo.com       Demo1234!   SALES_REP  — comeback narrative
fiona@demo.com      Demo1234!   SALES_REP  — long streak, lower points
george@demo.com     Demo1234!   SALES_REP  — daily cap overflow demo
hannah@demo.com     Demo1234!   SALES_REP  — no W21 activity, streak at risk
```

### CRM Integration & Identity Maps

```
CrmIntegration: { id: 'generic', webhookSecret: 'demo-secret-change-in-production' }
CrmUserMap: one entry per rep — provider: 'generic', externalId: 'user-{name}'
```

### Event Distribution (100+ events, 2 ISO weeks)

**Idempotency tests:** 3 duplicate eventIds — each submitted twice, second scores 0

**Cap overflow:** George — 8 `LEAD_CONTACTED` in one day. First 5 score, last 3 score 0.

**Badge unlocks:**
- Alice: FIRST_WIN (first deal_won in W20), CONSISTENT_CLOSER (3× deal_won in W21)
- Bob: PIPELINE_BUILDER (5× stage_advanced in W21)
- Fiona: HOT_STREAK (5 consecutive days of activity)

**Comeback narrative:** Evan — 80 weekPoints in W20, 160 in W21 — visible in leaderboard
week-over-week comparison.

**Negative points:** 2× `DEAL_LOST` per rep — tests XP floor and negative handling.

**Streak variety:**
- Alice: 7-day streak (STREAK_MILESTONE timeline entry at 7)
- Fiona: 5-day streak → HOT_STREAK
- George: gaps — streak reset twice
- Hannah: last active in W20, streak at risk in W21

**Leaderboard shape (W21):**
```
Rank 1  Alice    340 pts   (pointsGap: 0)
Rank 2  Diana    280 pts   (pointsGap: 60)
Rank 3  Bob      240 pts   (pointsGap: 40)
Rank 4  Charlie  180 pts   (pointsGap: 60)
Rank 5  Evan     160 pts   (pointsGap: 20)
Rank 6  Fiona    140 pts   (pointsGap: 20)
Rank 7  George   100 pts   (pointsGap: 40)
Rank 8  Hannah     0 pts   (pointsGap: 100)
```

---

## 25. Decisions & Tradeoffs

### D1 — Synchronous Scoring on POST /events

**Decision:** Score synchronously inside a Prisma transaction on `POST /events`.
Use queues only for webhook normalisation and notifications.

**Alternative:** Full async — enqueue every event, return jobId, client polls.

**Tradeoff:** The spec requires `pointsAwarded` in the response. The event simulator
requires immediate feedback. Synchronous scoring inside a transaction is correct and
fast (< 50ms under normal load). Async is reserved for work that is genuinely
fire-and-forget. Webhook ingestion stays async because HubSpot enforces a 5-second
response timeout and normalisation may involve external API calls.

**Production evolution:** At high throughput, move scoring to a worker and return
a jobId for polling. The transaction logic moves unchanged — the boundary shifts,
not the business logic.

---

### D2 — Postgres as Source of Truth, Redis Scoped

**Decision:** All durable state in Postgres. Redis handles BullMQ, leaderboard cache,
scoring config cache, and event dedup. No user stats cache. No distributed lock.

**Alternative:** Redis Sorted Sets for leaderboard, Redis hashes for user stats,
Redis locks for concurrency.

**Tradeoff:** Redis is not durable by default. AOF persistence helps but is not
Postgres-level guarantees. If Redis loses state, Postgres is the recovery source.
`SELECT FOR UPDATE` on `UserStats` handles concurrent event serialisation within
a single-instance deployment without adding distributed lock complexity.

**Production evolution:** Redis Sorted Sets for the leaderboard when `WeeklyStat`
becomes a write hotspot. Redis locks when scoring workers scale horizontally.

---

### D3 — Scoring Config Repository (JSON at runtime, DB-ready)

**Decision:** `IScoringConfigRepository` with `JsonScoringConfigRepository` (POC) reading
[`scoring-config.json`](../api/src/common/config/scoring-config.json). `ScoringConfigService`
adds Redis caching and invalidation. A DB-backed `IScoringConfigRepository` maps existing Prisma tables
for a one-line Nest swap when manager rule edits ship. DB tables are seeded from JSON for
demo parity, not used at runtime in POC.

**Alternative:** DB-only at runtime from day one.

**Tradeoff:** Spec-exact defaults without a deploy; clear migration path to editable rules
via `PATCH /admin/rules` + DB-backed `IScoringConfigRepository` + `ScoringConfigService.invalidate()`.

---

### D4 — Badge Definitions in Code

**Decision:** Typed `BadgeDefinition` objects in code. `BadgeType` is a Prisma enum.

**Alternative:** DB table — add badge by inserting a row.

**Tradeoff:** Compile-time type safety across the entire codebase (DTOs, switch
exhaustiveness, tests). Three required badges are stable. Adding a badge means
adding one object to an array and a migration to add the enum value. Clean and
auditable. Production path to DB-driven definitions is clear.

---

### D5 — CRM Adapter Pattern

**Decision:** Provider-specific adapters behind an interface, static webhook URL per
provider (`/webhooks/hubspot`), `CrmUserMap` for identity resolution.

**Alternative:** Single `POST /events` with canonical shape — simpler but requires
callers to normalise their payloads.

**Tradeoff:** ~300 lines for two adapters. The benefit is that HubSpot (batched,
no userId, HMAC v3) and Pipedrive (single event, userId in meta, different signature)
both connect correctly without transformation burden on the CRM side. Real integrations
fail at this boundary. HubSpot `resolveUserId` is a documented stub — requires live
credentials not available in POC.

---

### D6 — WeeklyStat Materialised

**Decision:** `WeeklyStat` updated in the scoring transaction. Leaderboard reads
are index scans on `(isoWeek, weekPoints)`.

**Alternative:** Aggregate `events.pointsAwarded` grouped by userId + ISO week at
query time.

**Tradeoff:** Two extra writes per scoring transaction in exchange for O(1) leaderboard
reads regardless of event history depth. At scale, aggregation queries become
expensive. The materialised row is the correct choice.

---

### D7 — DailyCap in Postgres

**Decision:** `DailyCap` table inside the scoring transaction.

**Alternative:** Redis INCR + TTL to midnight — atomic, auto-expiring.

**Tradeoff:** Correctness over performance. The cap row is inside the transaction —
if the transaction rolls back, the cap count rolls back. Redis INCR outside a
transaction can overcount on failures. For a fairness-critical system, Postgres
is the correct choice. Redis INCR is documented as the production performance optimisation.

---

### D8 — Duplicate Event Handling

**Decision:** `Event.eventId` is the Postgres PK. Duplicates cannot be inserted.
Redis `setNX` is the fast-path optimisation — not the correctness mechanism.

**Precise semantics:**
- Redis `setNX` returns false → return duplicate response immediately, no DB write
- Redis TTL expired (edge case) → Prisma throws `P2002` → caught → return duplicate response
- Duplicate events are never stored in the `Event` table

**Why this matters:** An earlier version of this document stated duplicates are "stored
but score zero" — that was incorrect. The Postgres PK prevents any insert. The correct
framing is: duplicates are acknowledged (HTTP 200, correct response shape) but never
persisted.

---

## 26. Production Readiness Recommendations

When asked "what would you change to make this production-ready?" — the answer is a
prioritised roadmap, not a laundry list.

### Week 1 — Before First Real User

**Secrets management**
`.env` files work locally. Production needs a secrets manager — AWS Secrets Manager,
HashiCorp Vault, or at minimum injection via deployment platform CI/CD. No secrets
in Docker images. No secrets in source control.

**JWT hardening**
Current: single 8-hour access token. Production: short-lived access token (15min) +
refresh token with rotation. Redis blocklist for token revocation on logout or
credential change (`jti` claim stored in Redis, checked on every request).

**Database backups**
No backup strategy exists. Production minimum: automated daily snapshots with
point-in-time recovery (PITR) enabled. RDS or managed Postgres handles this
automatically. Self-hosted needs a cron + `pg_dump` + offsite storage.

**CI/CD pipeline**
No pipeline exists. Minimum: `lint → typecheck → test → docker build → push → deploy`.
Include `prisma migrate deploy` as a pre-deploy step with a lock to prevent concurrent
migrations across instances.

**Graceful shutdown**
BullMQ workers need explicit `SIGTERM` handling — drain in-flight jobs before exit,
stop accepting new jobs. Without this, a deployment restart leaves jobs in an
inconsistent state.

**API versioning**
No versioning exists. Before any external CRM connects, establish a versioning strategy
(`/v1/events` or `Accept-Version` header). Breaking changes to a webhook endpoint that
HubSpot is already sending to are extremely costly.

**Environment validation on startup**
Already have Zod for scoring config. Extend to all env vars — fast-fail on
misconfiguration rather than failing at runtime with a cryptic error.

---

### Month 1 — Before Scale

**Distributed tracing**
No tracing. Production needs OpenTelemetry instrumentation — trace IDs flowing from
webhook receipt through queue processing through scoring transaction. Without this,
debugging a failed event across three hops (HTTP → ingestion queue → scoring) is
painful. Jaeger or Grafana Tempo as the backend.

**Metrics**
No metrics. Production minimum via `@willsoto/nestjs-prometheus`:
- Queue depth per queue (ingestion, notification)
- Scoring transaction latency p50/p95/p99
- Cache hit rate (leaderboard, scoring config)
- Event ingestion rate per provider
- Error rate per endpoint
- DLQ depth

**Alerting**
No alerting. Minimum alerts: DLQ depth > 10, scoring error rate > 1%, Postgres
connection pool saturation > 80%, Redis memory > 80%.

**Structured log aggregation**
`nestjs-pino` produces JSON logs. Production needs aggregation — Datadog, Grafana
Loki, AWS CloudWatch. Logs on a container are lost on restart.

**Database connection pooling**
Prisma's default pool is fine for development. Production needs PgBouncer or explicit
pool sizing based on expected concurrency. Unbounded connections under load will exhaust
Postgres.

**Transaction isolation level**
Prisma defaults to `READ COMMITTED`. For the streak update and weekly stat increment
under concurrent load, explicitly setting `REPEATABLE READ` is safer. Worth benchmarking
and documenting the decision.

**Redis replication**
Single Redis instance is a single point of failure. Production needs primary + replica,
or Redis Sentinel for automatic failover. BullMQ jobs live in Redis — if it goes down
and doesn't recover, jobs are lost.

---

### Quarter 1 — Growth Stage

**Feature flags**
No flag system. Production benefits from LaunchDarkly or a DB-backed flag table for
safely rolling out: new scoring rules, new badge types, notification changes, without
deployments. Critical for a system where scoring rules directly affect rep behaviour.

**Horizontal queue scaling**
BullMQ workers scale horizontally. When they do, `SELECT FOR UPDATE` on `UserStats`
becomes a bottleneck for high per-user event volume. Options: optimistic concurrency
with retry (increment + version check), or user-keyed queue routing (all events for a
user go to the same worker). Document the chosen strategy before scaling.

**Redis Sorted Sets for leaderboard**
`ZADD leaderboard:{isoWeek} weekPoints userId` — O(log N) writes, O(N) ranked reads,
native rank queries with `ZREVRANK`. Keep Postgres `WeeklyStat` as the reconciliation
source. Add this when leaderboard read latency becomes measurable.

**Redis INCR for daily caps**
`INCR cap:{userId}:{eventType}:{date}` with TTL to midnight — atomic, fast,
auto-expiring. Add this when `DailyCap` table write volume becomes measurable.

**DB-driven badge definitions**
When product managers want to create seasonal or promotional badges without deployments,
migrate from code-level `BADGE_DEFINITIONS` to a `BadgeDefinition` DB table with a
dynamic evaluation engine. The TypeScript interface is already the correct abstraction —
the runtime source changes, the interface does not.

**Per-organisation scoring rules**
Current rules are global. Multi-tenant production: `ScoringRule` gets an `orgId` FK,
resolved from JWT claims. Managers configure rules per organisation without affecting
others.

**Read replicas**
Leaderboard and profile reads can be served from a Postgres read replica to offload the
primary. Prisma supports this via `$extends` with read replica routing.

**CORS hardlist**
Current: NestJS default. Production: explicit origin allowlist. No wildcard in production.

**Rate limiting hardening**
Current: `@nestjs/throttler` on webhooks. Production: global rate limiting with per-user
limits in addition to per-IP, and sliding window rather than fixed window. DDoS
protection at the load balancer layer (CloudFront WAF, AWS Shield).

**Webhook secret rotation**
Current: static env var. Production: dual-secret acceptance window during rotation —
accept both old and new secret for a 24-hour window, then deactivate old. Audit log
of rotations.

**Index review under load**
Run `EXPLAIN ANALYZE` on every query pattern under realistic data volume before
going live. The indexes in the schema cover the obvious patterns but were designed
without profiling data.

---

## 27. Roadmap

### MVP Scope — Next Release

| Item | What it unlocks |
|---|---|
| `PUT /admin/rules/scoring/:eventType` | Managers edit point values at runtime |
| `PUT /admin/rules/caps/:eventType` | Managers adjust daily caps |
| Pipedrive adapter — full implementation | `meta.user_id` direct, straightforward |
| HubSpot `resolveUserId` — live | Requires HubSpot API credentials + CrmUserMap |
| Level-up notification | Rep notified when they advance a level |
| Near-badge notification (≥80%) | Rep told exactly what action gets them the badge |
| Streak broken notification | Encouragement after a reset |
| Weekly rep digest email | Monday morning recap — rank, XP, badges earned |
| Weekly manager digest email | Full leaderboard, top performers, at-risk reps |
| End-of-week push email | Friday nudge — current rank + points to overtake next rank |
| TOP_OF_THE_WEEK badge automation | Sunday 23:30 cron awards rank #1 |
| COMEBACK_KID badge automation | Sunday cron compares W-1 vs W-2 |
| WEEKLY_TOP_3 timeline entries | Written for top 3 finishers each week |
| PERSONAL_BEST_WEEK timeline entries | Detected and written by Sunday cron |

### PROD / Scale Scope — Future Architecture

| Item | Notes |
|---|---|
| Redis Sorted Sets leaderboard | O(log N) writes, native rank queries |
| Redis INCR daily caps | Atomic, auto-expiring, removes DailyCap table writes |
| DB-driven badge definitions | Add badges without code changes |
| Per-org scoring rules | Multi-tenant rule isolation |
| OAuth CRM onboarding | Self-service CrmUserMap setup |
| Salesforce adapter | SOAP/XML, no native HMAC — requires middleware |
| Horizontal queue worker scaling | With per-user queue routing or optimistic concurrency |
| WebSocket live updates | Real-time leaderboard + score events |
| Prometheus + Grafana | Full metrics and dashboards |
| OpenTelemetry tracing | End-to-end distributed traces |
| Leaderboard export CSV | `GET /admin/leaderboard/export` |
| Feature flag system | Safe rollout of rule changes |