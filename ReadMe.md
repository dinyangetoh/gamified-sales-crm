# Gamification Take-Home Assessment (TypeScript)

## Objective

Build a small backend service in TypeScript that gamifies Sales CRM activity.

The focus is business logic quality

You should implement an event-driven scoring system that:

- accepts CRM activity events
- calculates points and XP
- awards badges
- returns a weekly leaderboard

## Scenario

You are building an internal gamification engine for sales reps. Reps perform CRM actions (calls, meetings, stage changes, wins), and the system rewards meaningful progress while preventing easy abuse.

## Tech Requirements

- Language: TypeScript
- Runtime: your choice (Node.js recommended)
- Framework: your choice (Express, Fastify, Nest, etc.)
- Storage: your choice (in-memory, SQLite, Postgres, etc.)
- Tests: required
- Frontend technology is up to candidate choice and interpretation

## Functional Requirements

### 1) Ingest CRM Events

Create an endpoint to ingest events for a rep.

Required event types:

1. lead_contacted
2. meeting_completed
3. stage_advanced
4. deal_won
5. deal_lost

Minimum event fields:

- eventId (unique id for idempotency)
- userId
- eventType
- entityId (lead or opportunity id)
- timestamp
- metadata (optional object)

### 2) Scoring Rules

Implement these default point rules:

1. lead_contacted: +10
2. meeting_completed: +20
3. stage_advanced: +30
4. deal_won: +100
5. deal_lost: -20

Business logic expectations:

- events should be processed once only (idempotent by eventId)
- points should be attached to the user who triggered the event
- user total score and XP should update after each accepted event

### 3) XP and Levels

- XP equals total points, with floor at 0
- Level formula:
  - Level 1: 0 to 99 XP
  - Level 2: 100 to 249 XP
  - Level 3: 250 to 499 XP
  - Level 4: 500+ XP

Any equivalent deterministic level mapping is acceptable if documented.

### 4) Badges

Implement 3 badges:

1. First Win

- Unlock when user records first deal_won

2. Consistent Closer

- Unlock when user records 3 deal_won events within the same ISO week

3. Pipeline Builder

- Unlock when user records 5 stage_advanced events within the same ISO week

Badges should not be awarded multiple times.

### 5) Weekly Leaderboard

Create an endpoint that returns users ranked by points earned in a requested week.

Minimum response per user:

- userId
- weekPoints
- totalXP
- level
- badges (list)

Sort descending by weekPoints, then ascending by userId for tie-break.

### 6) Basic Anti-Gaming Rules

Implement both:

1. Idempotency

- duplicate eventId must not be scored twice

2. Daily cap for repetitive action

- max 5 lead_contacted events per user per day can earn points
- additional lead_contacted events that day are accepted but score 0

## Non-Functional Requirements

- Clear project structure
- Input validation with useful error messages
- Deterministic behavior for testing
- Readable code and naming
- Brief architecture notes in README

## API Contract (minimum)

### POST /events

Purpose:

- ingest one event
  Response:
- whether event was accepted
- points awarded for this event
- user current totals (xp, level)

### GET /users/:userId

Purpose:

- fetch user gamification state
  Response:
- total points/xp
- level
- unlocked badges

### GET /leaderboard?week=YYYY-Www

Purpose:

- fetch weekly leaderboard
  Response:
- ranked list with required fields

You may add endpoints if useful.

## Sample Data (for demonstration)

Provide a small seed script or fixture with:

- at least 3 users
- at least 20 events
- includes duplicates and cap-overflow cases
- includes at least one badge unlock

## Testing Requirements

Add tests for at least:

1. scoring per event type
2. idempotency (same eventId twice)
3. daily cap on lead_contacted
4. first badge unlock
5. leaderboard ordering and tie-break

Test framework is your choice.

## Deliverables

Submit:

1. source code
2. README with:

- setup and run instructions
- assumptions and tradeoffs
- architecture summary
- API examples

3. tests and how to run them

## Evaluation Rubric

We will evaluate on:

1. Business logic correctness (35%)
2. Code quality and maintainability (25%)
3. Test quality and coverage of edge cases (20%)
4. API and data modeling decisions (10%)
5. Documentation and clarity (10%)

## Nice-to-Have (optional)

If time remains:

- configurable scoring rules (for example, from JSON)
- simple event audit log endpoint
- Docker support

## Submission Notes

- Keep scope small and intentional.
- Document anything you intentionally defer.
- If you make simplifying assumptions, state them clearly.

---

## Solution

> **Product name:** Rally — a gamification engine for Sales CRM activity.

All spec requirements are met. The implementation goes further in several areas (see docs below).

### Documentation

| Document | Audience | Path |
|---|---|---|
| Executive Summary | Non-technical reviewers | [`docs/EXECUTIVE_SUMMARY.md`](./docs/EXECUTIVE_SUMMARY.md) |
| System Design | Engineering team / technical reviewers | [`docs/SYSTEM_DESIGN.md`](./docs/SYSTEM_DESIGN.md) |
| Implementation Plan | Full ADR + architectural decisions | [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) |
| Coding Standards | Linting, naming, test conventions | [`docs/CODING_STANDARDS.md`](./docs/CODING_STANDARDS.md) |

### Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| **Docker Desktop** | 24+ (with Compose V2) | [docker.com/get-started](https://www.docker.com/get-started) |
| **Node.js** | 20 LTS | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| **npm** | 10+ | Bundled with Node.js 20 |

**Ports used:**

| Service | Port |
|---|---|
| Next.js Web | 3000 |
| NestJS API | 4000 |
| Swagger UI | 4000/api-docs |
| PostgreSQL | 5432 |
| Redis | 6379 |

Make sure Docker Desktop is running and those ports are free before starting.

### Quick Start

**One command — first run (migrates, seeds, and starts everything):**

```bash
./start.sh --seed
```

**Subsequent runs (infrastructure already seeded):**

```bash
./start.sh
```

**Other flags:**

```bash
./start.sh --reset   # wipe gamification data, re-seed, then start
./start.sh --stop    # stop Docker infrastructure
./start.sh --help    # show all options
```

The script handles everything automatically: starts Docker infrastructure (Postgres + Redis), installs dependencies if needed, bootstraps `api/.env` from `.env.example`, runs migrations and seed, then launches the API and Web concurrently with colour-coded logs. Press `Ctrl+C` to stop all services cleanly.

**Manual steps (if you prefer full control):**

```bash
# 1. Start infrastructure (Postgres + Redis)
docker compose -f docker-compose.dev.yml up -d

# 2. API — install, migrate, seed, start
cd api
npm install
npm run db:migrate          # apply Prisma migrations
npm run db:seed             # create users + scoring config
npm run demo:seed:clean     # replay ~200 demo events through the real scoring engine
npm run dev                 # → http://localhost:4000
                            # → http://localhost:4000/api-docs (Swagger UI)

# 3. Frontend (new terminal)
cd ../web && npm install && npm run dev
# → http://localhost:3000
```

**Demo login:** `alice@demo.com` (rep) or `manager@demo.com` (manager) — password: `Demo1234!`  
**Current leaderboard week:** `GET /leaderboard?week=2026-W22`

### Key Source Files

| Area | File |
|---|---|
| Scoring orchestration | [`api/src/modules/scoring/ScoringEventProcessor.ts`](./api/src/modules/scoring/ScoringEventProcessor.ts) |
| Badge definitions | [`api/src/modules/badges/badgeDefinitions.ts`](./api/src/modules/badges/badgeDefinitions.ts) |
| Badge evaluation | [`api/src/modules/badges/BadgesService.ts`](./api/src/modules/badges/BadgesService.ts) |
| Leaderboard | [`api/src/modules/leaderboard/LeaderboardService.ts`](./api/src/modules/leaderboard/LeaderboardService.ts) |
| Scoring config (JSON) | [`api/src/common/config/scoring-config.json`](./api/src/common/config/scoring-config.json) |
| Scoring config repository | [`api/src/modules/scoring/repositories/IScoringConfigRepository.ts`](./api/src/modules/scoring/repositories/IScoringConfigRepository.ts) |
| Prisma schema | [`api/prisma/schema.prisma`](./api/prisma/schema.prisma) |
| HMAC webhook guard | [`api/src/common/guards/WebhookGuard.ts`](./api/src/common/guards/WebhookGuard.ts) |
| Error handling | [`api/src/common/errors/ServiceErrorHandler.ts`](./api/src/common/errors/ServiceErrorHandler.ts) |
| Streak helper | [`api/src/common/helpers/scoring/streakHelper.ts`](./api/src/common/helpers/scoring/streakHelper.ts) |
| Demo seed script | [`api/scripts/seedDemo.ts`](./api/scripts/seedDemo.ts) |
| Health check | [`api/src/common/health/HealthController.ts`](./api/src/common/health/HealthController.ts) |

### Test Coverage Summary

```bash
cd api
npm test          # unit tests (Jest)
npm run test:e2e  # E2E tests via Supertest (requires running Postgres + Redis)
npm run test:cov  # unit tests with coverage report
```

129 test cases across 23 test files covering: scoring rules, idempotency, daily cap, XP floor,
badge unlock / idempotency / repeat-per-week logic, streak boundary conditions, leaderboard
ordering, error handling, webhook HMAC validation, and health check contract.

### Spec Coverage

| Requirement | Status |
|---|---|
| Event ingestion (`POST /events`) | ✅ |
| 5 event types with correct point values | ✅ |
| Idempotency by `eventId` | ✅ dual-layer: Redis `setNX` + Postgres unique constraint |
| Daily cap (max 5 `LEAD_CONTACTED`/day) | ✅ atomic — checked and incremented inside transaction |
| XP = total points, floor at 0 | ✅ |
| Level system (L1–L4 thresholds) | ✅ config-driven, deterministic |
| 3 required badges (First Win, Consistent Closer, Pipeline Builder) | ✅ |
| Badges not awarded more than once | ✅ `BadgeRepeatPolicy` + DB unique constraint |
| Weekly leaderboard sorted `weekPoints DESC, userId ASC` | ✅ |
| Leaderboard response: userId, weekPoints, totalXP, level, badges | ✅ |
| Seed: 3+ users, 20+ events, duplicates, cap overflows, badge unlock | ✅ 9 users, ~200 events |
| Tests for all 5 required scenarios | ✅ |
| Docker support *(nice-to-have)* | ✅ |
| Configurable scoring rules *(nice-to-have)* | ✅ JSON file + DB-backed repository ready |
| Event audit log endpoint *(nice-to-have)* | ✅ `GET /users/:userId/feed` |

