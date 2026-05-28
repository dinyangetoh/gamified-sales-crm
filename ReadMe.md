# Rally — Gamified Sales CRM Dashboard

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
| Assessment Instructions | Take-home requirements and rubric | [`docs/instructions.md`](./docs/instructions.md) |

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

