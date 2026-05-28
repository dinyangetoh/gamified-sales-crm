# Rally — System Design

> Technical reference for the engineering team.  
> Companion document: [`EXECUTIVE_SUMMARY.md`](./EXECUTIVE_SUMMARY.md) — for non-technical stakeholders

**Stack:** NestJS · PostgreSQL · Redis · BullMQ · Next.js 16 (App Router)  
**Tier:** POC (Production-ready foundations, MVP scope deferred — see §8)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model](#2-data-model)
3. [Request Lifecycle — Event Ingestion](#3-request-lifecycle--event-ingestion)
4. [Scoring Engine](#4-scoring-engine)
5. [Badge System](#5-badge-system)
6. [Leaderboard](#6-leaderboard)
7. [CRM Integration Layer](#7-crm-integration-layer)
8. [Notification Pipeline](#8-notification-pipeline)
9. [Frontend Architecture](#9-frontend-architecture)
10. [User Flows](#10-user-flows)
11. [Anti-Gaming Design](#11-anti-gaming-design)
12. [Key Decisions & Tradeoffs](#12-key-decisions--tradeoffs)
13. [Installation & Running Locally](#13-installation--running-locally)
14. [Testing](#14-testing)
15. [Scaling Path](#15-scaling-path)

---

## 1. Architecture Overview

```mermaid
graph TD
    subgraph CRM["CRM Systems"]
        HS[HubSpot]
        PD[Pipedrive]
        SF[Salesforce]
    end

    subgraph API["Rally API — NestJS"]
        WH[Webhook Guard\nHMAC Validation]
        EC[Events Controller]
        SS[Scoring Service]
        BS[Badges Service]
        LS[Leaderboard Service]
        NQ[Notification Queue\nBullMQ]
    end

    subgraph Storage["Storage"]
        PG[(PostgreSQL\nSource of Truth)]
        RD[(Redis\nIdempotency + Queue)]
    end

    subgraph Workers["Background Workers"]
        NW[Notification Worker]
        ES[Email Service\nResend]
    end

    subgraph Frontend["Rally Web — Next.js 16"]
        REP[Sales Rep View]
        MGR[Manager View]
    end

    HS -->|Webhook + HMAC| WH
    PD -->|Webhook + HMAC| WH
    SF -->|Webhook + HMAC| WH
    WH --> EC
    EC --> SS
    SS --> BS
    SS --> PG
    SS --> RD
    SS --> NQ
    NQ --> NW
    NW --> ES
    LS --> PG
    Frontend -->|REST / fetch| API
```

### Component Responsibilities

| Component | Role |
|---|---|
| **Webhook Guard** | HMAC signature validation per CRM provider before any processing |
| **Events Controller** | HTTP boundary — request validation, response shaping |
| **Scoring Service** | Core orchestrator — idempotency check, point calculation, level derivation, transaction management |
| **Badges Service** | Evaluates badge conditions post-scoring; awards exactly once |
| **Leaderboard Service** | Aggregates weekly points from `AwardTimeline`; returns ranked list |
| **Notification Queue** | Decouples notification side-effects from the scoring transaction |
| **Notification Worker** | Consumes jobs from BullMQ; calls Resend for email delivery |
| **PostgreSQL** | Durable source of truth for all gamification state |
| **Redis** | Fast-path idempotency (`setNX`), BullMQ backing store |

---

## 2. Data Model

```mermaid
erDiagram
    User {
        string id PK
        string email
        string name
        string orgId FK
        datetime createdAt
    }

    UserStats {
        string userId PK FK
        int totalXp
        int weekPoints
        int streakDays
        int bestStreak
        date lastActiveDate
        datetime updatedAt
    }

    CrmEvent {
        string id PK
        string externalId UK "idempotency key"
        string userId FK
        string eventType
        string entityId
        int pointsAwarded
        boolean capped
        boolean duplicate
        json metadata
        datetime occurredAt
        datetime processedAt
    }

    DailyEventCap {
        string userId FK
        string eventType
        date date
        int count
        PK "(userId, eventType, date)"
    }

    BadgeAward {
        string id PK
        string userId FK
        string badgeKey UK "(userId, badgeKey, weekKey)"
        string weekKey
        datetime awardedAt
    }

    BadgeProgress {
        string userId FK
        string badgeKey FK
        string weekKey
        int currentCount
        PK "(userId, badgeKey, weekKey)"
    }

    AwardTimeline {
        string id PK
        string userId FK
        string eventType
        int delta
        int runningTotal
        string sourceEventId FK
        datetime occurredAt
    }

    Organisation {
        string id PK
        string name
        json scoringConfig
        json levelConfig
    }

    User ||--|| UserStats : "has"
    User ||--o{ CrmEvent : "triggers"
    User ||--o{ DailyEventCap : "tracked by"
    User ||--o{ BadgeAward : "earns"
    User ||--o{ BadgeProgress : "accumulates"
    User ||--o{ AwardTimeline : "generates"
    User }o--|| Organisation : "belongs to"
    CrmEvent ||--o{ AwardTimeline : "produces"
```

### Design Notes

- `externalId` carries the CRM-assigned event ID — the unique constraint here is the last-resort duplicate guard
- `AwardTimeline` is append-only — never updated, never deleted — providing a complete audit ledger
- `DailyEventCap` uses a composite PK `(userId, eventType, date)` — the counter is incremented atomically inside the scoring transaction
- `scoringConfig` and `levelConfig` are stored as JSON on `Organisation`, enabling per-org rule customisation in MVP without schema changes
- `BadgeAward` unique constraint on `(userId, badgeKey, weekKey)` prevents double-award under concurrent load

---

## 3. Request Lifecycle — Event Ingestion

```mermaid
sequenceDiagram
    actor CRM
    participant Guard as Webhook Guard
    participant Controller as Events Controller
    participant Scoring as Scoring Service
    participant Redis
    participant DB as PostgreSQL
    participant Queue as BullMQ

    CRM->>Guard: POST /events + x-crm-provider + HMAC header
    Guard->>Guard: Resolve adapter by provider header
    Guard->>Guard: Validate HMAC signature
    alt Signature invalid
        Guard-->>CRM: 401 Unauthorized
    end

    Guard->>Controller: Pass request
    Controller->>Controller: Validate body schema (Zod)
    alt Schema invalid
        Controller-->>CRM: 400 Bad Request + field errors
    end

    Controller->>Scoring: processEvent(dto)

    Scoring->>Redis: SETNX idempotency:{externalId} TTL 24h
    alt Key already exists
        Redis-->>Scoring: 0 (already processed)
        Scoring-->>Controller: { status: ALREADY_PROCESSED }
        Controller-->>CRM: 200 + ALREADY_PROCESSED
    end

    Scoring->>DB: BEGIN TRANSACTION
    DB->>DB: SELECT UserStats FOR UPDATE
    DB->>DB: SELECT DailyEventCap WHERE date=today
    
    alt Daily cap reached (lead_contacted ≥ 5)
        DB-->>Scoring: cap exceeded
        Scoring->>DB: INSERT CrmEvent (capped=true, points=0)
        Scoring->>DB: COMMIT
        Scoring-->>Controller: { status: CAPPED, pointsAwarded: 0 }
        Controller-->>CRM: 200 + CAPPED
    end

    Scoring->>DB: Calculate points from config
    Scoring->>DB: UPDATE UserStats (xp, weekPoints, streak)
    Scoring->>DB: INSERT CrmEvent
    Scoring->>DB: UPSERT DailyEventCap (count++)
    Scoring->>DB: INSERT AwardTimeline
    Scoring->>Scoring: Evaluate badges
    Scoring->>DB: UPSERT BadgeProgress
    alt Badge threshold met
        Scoring->>DB: INSERT BadgeAward (unique constraint guard)
    end
    Scoring->>DB: COMMIT

    Scoring->>Queue: enqueue(BADGE_UNLOCK | LEVEL_UP notification)
    Scoring-->>Controller: { status: ACCEPTED, pointsAwarded, xp, level }
    Controller-->>CRM: 200 + result
```

---

## 4. Scoring Engine

### Point Calculation

```mermaid
flowchart TD
    A[Receive eventType] --> B{Look up\nscoringConfig}
    B --> C[basePts = config.points for eventType]
    C --> D{eventType ==\nlead_contacted?}
    D -- Yes --> E{DailyEventCap\ncount >= 5?}
    E -- Yes --> F[points = 0\ncapped = true]
    E -- No --> G[points = basePts\nIncrement cap counter]
    D -- No --> H[points = basePts]
    F --> I[Update UserStats\nnewXP = max 0, currentXP + points]
    G --> I
    H --> I
    I --> J[Derive level from XP thresholds]
    J --> K{Level changed?}
    K -- Yes --> L[Enqueue LEVEL_UP notification]
    K -- No --> M[Return result]
    L --> M
```

### Scoring Configuration (default)

Source of truth: [`api/src/common/config/scoring-config.json`](../api/src/common/config/scoring-config.json), loaded at runtime via `JsonScoringConfigRepository`.

| Event Type | Points | Daily Cap |
|---|---|---|
| `LEAD_CONTACTED` | +10 | 5 / day |
| `MEETING_COMPLETED` | +20 | — |
| `STAGE_ADVANCED` | +30 | — |
| `DEAL_WON` | +100 | — |
| `DEAL_LOST` | −20 | — |

### Scoring Config Repository Pattern

The scoring configuration is abstracted behind `IScoringConfigRepository` to allow a zero-friction swap between the JSON file (POC) and live DB rows (MVP, when manager rule editing ships).

```mermaid
classDiagram
    class IScoringConfigRepository {
        <<interface>>
        +getConfig() Promise~ScoringConfig~
    }

    class JsonScoringConfigRepository {
        -cached: ScoringConfig
        +getConfig() Promise~ScoringConfig~
    }

    class FutureDbScoringConfigRepository {
        -scoringRepo: ScoringRepository
        +getConfig() Promise~ScoringConfig~
    }

    IScoringConfigRepository <|.. JsonScoringConfigRepository
    IScoringConfigRepository <|.. FutureDbScoringConfigRepository
    FutureDbScoringConfigRepository --> ScoringRepository : MVP reads ScoringRule + LevelConfig + DailyCapConfig
```

**POC (current):** `JsonScoringConfigRepository` reads `scoring-config.json` once and caches in memory — zero DB round-trips per request.

**MVP swap:** Implement `IScoringConfigRepository` against Prisma config tables and change the NestJS provider token from `JsonScoringConfigRepository` to that implementation. Callers use `ScoringConfigService` / `IScoringConfigRepository`, not the concrete class.

### Level Thresholds

| Level | Label | Min XP |
|---|---|---|
| L1 | Rookie | 0 |
| L2 | Closer | 100 |
| L3 | Elite | 250 |
| L4 | Legend | 500 |

---

## 5. Badge System

### Badge Catalogue

| Badge | Trigger | Scope |
|---|---|---|
| **First Win** | First `DEAL_WON` ever | Lifetime |
| **Consistent Closer** | 3× `DEAL_WON` in same ISO week | Weekly |
| **Pipeline Builder** | 5× `STAGE_ADVANCED` in same ISO week | Weekly |
| **Hot Streak** | 5 consecutive calendar days with activity | Lifetime |
| **Top of the Week** | Finish #1 on leaderboard at week close | Weekly |
| **Comeback Kid** | Earn more points this week than last week | Weekly |

### Badge Evaluation Flow

```mermaid
flowchart TD
    A[Post-scoring, inside transaction] --> B{Event type?}
    B -- DEAL_WON --> C{First ever DEAL_WON?}
    C -- Yes --> D[Award: First Win]
    C -- No --> E{3rd DEAL_WON\nthis ISO week?}
    E -- Yes --> F[Award: Consistent Closer]
    B -- STAGE_ADVANCED --> G{5th STAGE_ADVANCED\nthis ISO week?}
    G -- Yes --> H[Award: Pipeline Builder]
    B -- Any --> I{Streak ≥ 5 days?}
    I -- Yes --> J[Award: Hot Streak]
    D & F & H & J --> K[INSERT BadgeAward\nunique constraint prevents double-award]
    K --> L[Enqueue BADGE_UNLOCK notification]
```

### Idempotency Under Concurrency

Two simultaneous events that both cross a badge threshold will race on the `INSERT BadgeAward`. The unique constraint `(userId, badgeKey, weekKey)` ensures exactly one succeeds — the other receives a unique violation which the service catches and silently discards. No double-award is possible.

---

## 6. Leaderboard

### POC Implementation

```mermaid
flowchart LR
    A["GET /leaderboard?week=2025-W21"] --> B[Parse ISO week → date range]
    B --> C["SELECT userId, SUM(delta) AS weekPoints\nFROM AwardTimeline\nWHERE occurredAt BETWEEN weekStart AND weekEnd\nGROUP BY userId\nORDER BY weekPoints DESC, totalXP DESC, currentStreak DESC"]
    C --> D[JOIN UserStats for totalXp, level, streakDays]
    D --> E[JOIN BadgeAward for badge list]
    E --> F[Return ranked list]
```

**Sort rule (weekly):** `weekPoints DESC`, then `totalXP DESC`, then `currentStreak DESC`.

**Sort rule (all-time):** `totalXP DESC`, then `currentStreak DESC`.

**Points-behind calculation:** `leaderPosition[0].weekPoints - entry.weekPoints` — surfaced in the UI as contextual motivation ("Diana is 60 pts behind you").

### Scale Migration Path (MVP trigger: p99 > 100ms)

```mermaid
flowchart TD
    A["Event scored"] --> B["UPDATE Postgres\n(source of truth)"]
    B --> C["ZADD leaderboard:2025-W21\nuserId score Redis Sorted Set"]
    C --> D["Leaderboard reads\nZREVRANGEBYSCORE O(log N)"]
```

Redis Sorted Sets provide O(log N) reads with sub-millisecond latency at any team size. Migration is non-breaking: write to both Postgres and Redis, switch reads to Redis, validate, then make Postgres the async reconciliation path.

---

## 7. CRM Integration Layer

### Adapter Pattern

```mermaid
classDiagram
    class CrmAdapter {
        <<interface>>
        +validateSignature(req: Request) boolean
        +resolveUserId(payload: unknown) Promise~string~
    }

    class HubSpotAdapter {
        -secret: string
        +validateSignature(req) boolean
        +resolveUserId(payload) Promise~string~
    }

    class PipedrivAdapter {
        -secret: string
        +validateSignature(req) boolean
        +resolveUserId(payload) Promise~string~
    }

    class GenericAdapter {
        +validateSignature(req) boolean
        +resolveUserId(payload) Promise~string~
    }

    CrmAdapter <|.. HubSpotAdapter
    CrmAdapter <|.. PipedrivAdapter
    CrmAdapter <|.. GenericAdapter

    class WebhookGuard {
        -adapters: Map~string, CrmAdapter~
        +canActivate(ctx) boolean
    }

    WebhookGuard --> CrmAdapter : "resolves by x-crm-provider header"
```

### HubSpot Signature Validation (HMAC-SHA256)

```
HMAC = SHA256(clientSecret + requestMethod + requestUri + requestBody + timestamp)
Compare to X-HubSpot-Signature-v3 header
Reject if |serverTime - requestTimestamp| > 5 minutes
```

### Adding a New CRM Provider

1. Implement `CrmAdapter` interface
2. Register the adapter in the `CrmModule` provider map under the provider key
3. The `WebhookGuard` picks it up automatically — no changes to the core pipeline

---

## 8. Notification Pipeline

### Queue Architecture

```mermaid
flowchart LR
    subgraph Transaction["Scoring Transaction"]
        SS[Scoring Service] -->|COMMIT| PG[(PostgreSQL)]
    end
    SS -->|"enqueue() after commit"| BQ[BullMQ\nRally Notifications Queue]
    BQ --> NW[Notification Worker]
    NW --> EM{Channel}
    EM --> RSN[Resend\nEmail]
    EM --> SLK[Slack\nfuture]
    EM --> PSH[Push\nfuture]
```

**Key design choice:** Notification is enqueued *after* the transaction commits. This prevents a committed score from triggering a notification on rollback, and prevents a notification failure from rolling back a valid score.

### Notification Types

| Key | Trigger | Recipient |
|---|---|---|
| `BADGE_UNLOCK` | BadgeAward written | Rep |
| `LEVEL_UP` | Level increases | Rep |
| `NEAR_BADGE` | Badge progress ≥ 80% | Rep |
| `STREAK_RISK` | No activity logged by 18:00 local | Rep |
| `STREAK_BROKEN` | Streak resets to 0 | Rep |
| `WEEKLY_REP_DIGEST` | Sunday 20:00 UTC | Rep |
| `END_OF_WEEK_PUSH` | Sunday 17:00 UTC | Rep |
| `TOP_OF_WEEK_AWARD` | After leaderboard locks | Rep (rank #1) |
| `WEEKLY_MGR_DIGEST` | Monday 08:00 UTC | Manager |

---

## 9. Frontend Architecture

### Application Structure

```
web/
├── app/
│   ├── (rep)/           # Sales Rep role group
│   │   ├── dashboard/   # Personal stats, streak, badge progress
│   │   ├── leaderboard/ # Ranked view with podium
│   │   └── activity/    # Event log + heatmap
│   ├── (manager)/       # Manager role group
│   │   ├── overview/    # Team KPIs + charts
│   │   ├── leaderboard/ # Manager leaderboard view
│   │   ├── reps/        # Rep roster with drill-down
│   │   ├── rules/       # Scoring config (read-only POC)
│   │   ├── simulator/   # Live event simulator (see below)
│   │   └── email-templates/ # Notification preview tool
│   └── layout.tsx       # Root layout with auth + role routing
├── components/          # Shared UI primitives
├── lib/
│   ├── api.ts           # Typed fetch client
│   └── auth.ts          # Session + role resolution
└── design/
    └── screenshots/     # 18 design references
```

### Data Flow

```mermaid
flowchart LR
    A[Next.js Server Component] -->|Server-side fetch| B[Rally API]
    B --> C[Render HTML with data]
    C --> D[Client hydration]
    D -->|SWR / client fetch for live data| B
```

Server Components handle the initial data fetch (no loading flash). Client components handle interactive elements (streak calendar hover, chart tooltips, leaderboard rank deltas).

### Manager Event Simulator

The manager dashboard includes a built-in **event simulator** — a panel that lets a manager fire any event type for any rep directly from the UI, without needing a live CRM integration. The request is routed through the same `POST /events` endpoint the CRM uses, so every response reflects live engine behaviour.

This serves two purposes:

1. **Demo** — evaluators and new users can explore the scoring system and see real-time scoring responses without a CRM connected
2. **Rule validation** — when scoring config changes in MVP, the simulator lets a manager immediately verify the effect before it goes live

The simulator panel returns the full engine response inline: `status`, `pointsAwarded`, `currentXP`, `currentLevel`, and whether the event was capped or a duplicate.

---

## 10. User Flows

### Sales Rep — Start of Day

```mermaid
journey
    title Sales Rep Morning Flow
    section CRM Activity
      Rep logs a call in CRM: 5: Rep
      HubSpot fires LEAD_CONTACTED webhook: 3: System
      Rally validates HMAC signature: 3: System
      Points awarded, streak updated: 5: System
    section Dashboard Check
      Rep opens Rally dashboard: 5: Rep
      Sees +10 pts, streak extended to 8 days: 5: Rep
      Notices "2 more deals to Consistent Closer badge": 4: Rep
      Motivation to close more deals today: 5: Rep
```

### Manager — Weekly Review

```mermaid
journey
    title Manager Monday Review
    section Team Overview
      Manager opens Overview page: 5: Manager
      Sees team scored 1440 pts last week: 4: Manager
      Notices win rate up 5% WoW: 5: Manager
    section Coaching Insights
      Checks activity heatmap: 4: Manager
      Identifies Tuesday afternoon as peak activity: 3: Manager
      Checks Reps table for low-event reps: 4: Manager
      Identifies Hannah Lee with 0 events: 5: Manager
    section Action
      Schedules 1:1 with Hannah: 5: Manager
      Checks leaderboard to prepare shoutouts: 5: Manager
```

### Event Processing — Happy Path vs Edge Cases

```mermaid
flowchart TD
    A[CRM sends event] --> B{HMAC valid?}
    B -- No --> C[401 Reject]
    B -- Yes --> D{externalId seen before?}
    D -- Yes --> E[200 ALREADY_PROCESSED\n0 pts, no state change]
    D -- No --> F{lead_contacted cap reached today?}
    F -- Yes --> G[200 CAPPED\n0 pts, event logged]
    F -- No --> H[Score event\nUpdate stats\nCheck badges\nEnqueue notifications]
    H --> I[200 ACCEPTED\npointsAwarded, xp, level]
```

---

## 11. Anti-Gaming Design

### Threat Model

| Threat | Mitigation |
|---|---|
| Replay the same event | Redis `setNX` fast-path + Postgres unique constraint on `externalId` |
| Flood `lead_contacted` for easy points | Daily cap: max 5 per user per day score; extras accepted but award 0 |
| Fake webhook from non-CRM source | HMAC-SHA256 signature validation before any processing |
| Race condition on badge double-award | DB unique constraint `(userId, badgeKey, weekKey)` — second INSERT fails silently |
| TOCTOU on daily cap check | Cap check and counter increment are inside the same serialisable transaction |
| Sham deal creation and deletion | `DEAL_LOST` carries −20 pts — a rep who creates a sham deal and loses it nets +80 pts, not +100; combined with streak risk this is a meaningful deterrent |

### Idempotency Guarantee — Dual Layer

```mermaid
flowchart LR
    A[Incoming event] --> B["Redis SETNX\nidempotency:{externalId}"]
    B -- "0 (exists)" --> C[Return ALREADY_PROCESSED\nno DB touch]
    B -- "1 (new)" --> D[Process + write to DB]
    D --> E["DB unique constraint\n(userId, externalId)"]
    E -- Conflict --> F[Catch unique violation\nreturn ALREADY_PROCESSED]
    E -- OK --> G[Committed]
```

Redis handles the hot path (sub-millisecond). Postgres handles the race condition where two concurrent requests both pass the Redis check before either commits to the DB.

---

## 12. Key Decisions & Tradeoffs

| Decision | Alternative Considered | Rationale |
|---|---|---|
| **NestJS** over Express/Fastify | Fastify (faster) | DI container, guard/interceptor pattern, and Swagger generation make it worth the overhead for a service of this complexity |
| **Prisma** as ORM | TypeORM, Drizzle, raw SQL | Type-safe queries, excellent migration tooling, readable schema file; minor: no batch upsert without raw SQL |
| **PostgreSQL** as source of truth | SQLite (simpler), MongoDB | ACID transactions are non-negotiable for the scoring invariants; full-text and JSON support as bonus |
| **Redis for idempotency** over DB-only | DB unique constraint only | Redis `setNX` handles the hot path without touching the DB; constraint remains as safety net |
| **BullMQ** for notifications | Sync email send, cron jobs | Decouples scoring latency from email latency; natural retry/dead-letter on delivery failure |
| **Scoring inside transaction** | Async scoring | XP, badges, and streak must be consistent with each other; async scoring creates a consistency window |
| **ISO week boundary** for weekly badges | Rolling 7-day window | Simpler, predictable, aligns with natural work week; less fair for reps who work weekends |
| **Leaderboard from Postgres** | Redis Sorted Sets | Correct for POC scale; migration path documented with trigger metric (p99 > 100ms) |
| **`JsonScoringConfigRepository` as default** | Future DB-backed `IScoringConfigRepository` | JSON file is zero-dependency for the POC; MVP adds a Prisma-backed implementation and changes one NestJS provider token |

---

## 13. Installation & Running Locally

### Prerequisites

- Docker Desktop (for Postgres + Redis)
- Node.js ≥ 20
- `npm` ≥ 10

### Environment Variables

Create `api/.env` from `api/.env.example`:

```
DATABASE_URL=postgresql://rally:rally@localhost:5432/rally
REDIS_URL=redis://localhost:6379
JWT_SECRET=<any-local-secret>
RESEND_API_KEY=<optional-for-email>
HUBSPOT_WEBHOOK_SECRET=<optional-for-hubspot>
```

### Start

```bash
# 1. Infrastructure
docker compose -f docker-compose.dev.yml up -d

# 2. API (migrations, base seed, demo events)
cd api
npm install
npm run db:migrate
npm run db:seed              # users, CRM maps, scoring config tables
npm run demo:seed:clean      # replay demo/events/*.json through ScoringService (requires Redis)
npm run dev
# → http://localhost:4000
# → http://localhost:4000/api-docs  (Swagger)

# 3. Frontend
cd ../web
npm install
npm run dev
# → http://localhost:3000
```

### Demo Credentials

Password for all accounts: `Demo1234!`

| Role | Email | Notes |
|---|---|---|
| Sales Rep | `alice@demo.com` | High XP, badges, streak |
| Manager | `manager@demo.com` | Rules + rep overview |

**Leaderboard “this week” (May 2026 demo):** `GET /leaderboard?week=2026-W22`  
Demo event files are labeled `2026-W19` … `2026-W25`; see `demo/events/manifest.json` for the file → ISO week map.

**Reset demo gamification data:** `npm run demo:seed:clean` (wipes events/stats/badges/timeline + Redis dedup/leaderboard caches; keeps users).

---

## 14. Testing

### Test Matrix

| Layer | Framework | What's Covered |
|---|---|---|
| Unit | Jest | Scoring rules, daily cap, level derivation, badge threshold logic, idempotency fast-path |
| Integration | Jest + Prisma test DB | Transaction correctness, cap counter atomicity, badge unique constraint |
| E2E | Jest + Supertest | Full HTTP contract: happy path, duplicate 200, capped 200, 401 unauthorised, schema validation |

### Running Tests

```bash
cd api

# All tests
npm test

# Unit only
npm run test:unit

# E2E only (requires running Postgres)
npm run test:e2e

# Coverage report
npm run test:cov
```

### Critical Test Cases

| Test | Why it matters |
|---|---|
| Same `externalId` submitted twice → second returns `ALREADY_PROCESSED` | Core idempotency guarantee |
| 6th `lead_contacted` in a day → `pointsAwarded: 0` | Daily cap correctness |
| `DEAL_LOST` with XP = 5 → XP floors at 0 | No negative XP |
| Two concurrent badge-threshold events → exactly one badge awarded | Race condition safety |
| Leaderboard tie-break → higher `totalXP`, then higher `currentStreak` ranks higher | Business-driven tie-break |

---

## 15. Scaling Path

### POC → MVP (current sprint focus)

| Item | Trigger | Change |
|---|---|---|
| HubSpot userId resolution | First HubSpot customer | Implement HubSpot Owners API call in `resolveUserId` stub |
| Manager rule editor | First config-change request | UI form → `PATCH /orgs/:id/config` → update `Organisation.scoringConfig` |
| Email delivery | Badge notifications required | Enable Resend worker, add `RESEND_API_KEY` to prod env |
| Pipedrive adapter | First Pipedrive customer | Implement `PipedriveAdapter` class (interface already defined) |

### MVP → Scale (monitor and trigger)

| Metric | Threshold | Action |
|---|---|---|
| Leaderboard API p99 | > 100ms | Migrate to Redis Sorted Sets |
| Events queue depth | > 10,000 | Add worker replicas (BullMQ horizontal scale) |
| Postgres connections | > 80% pool | Add PgBouncer connection pooler |
| Weekly active reps | > 500 | Partition `AwardTimeline` by `occurredAt` month |
| Team count | > 100 orgs | Extract `Organisation` into its own service (multi-tenancy isolation) |

---

*Document version: POC | Last updated: 2026-05-27*  
*Full architectural decisions: [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md)*
