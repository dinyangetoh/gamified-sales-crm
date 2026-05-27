Read before making changes:

- **Architecture & design decisions:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- **Naming, files, Prisma, tests:** [CODING_STANDARDS.md](CODING_STANDARDS.md)

Local dev (API): `cd api && npm run start:dev`
Build: `cd api && npm run build`
Tests: `cd api && npm test`
E2E tests: `cd api && npm run test:e2e`
Seed database: `cd api && npx prisma db seed`
Docker (full stack): `docker compose up`
Docker (dev deps only): `docker compose -f docker-compose.dev.yml up -d`

## Tests (mandatory)

Read [CODING_STANDARDS.md](CODING_STANDARDS.md) § Testing before merging behavior changes.

- **Unit** (`test/unit/**/{ClassName}.spec.ts`): required for every `*Service.ts`; paths mirror `api/src/modules/` (e.g. `test/unit/scoring/ScoringService.spec.ts`). Mock with **`mock<IInterface>()`** from `jest-mock-extended`. Never place specs under `api/src/`. Never mock Prisma.
- **E2E** (`test/e2e/**/*.e2e-spec.ts`): HTTP routes — supertest, real Postgres + Redis. Run `docker compose -f docker-compose.dev.yml up -d` first.

## API docs

Swagger UI: `http://localhost:3001/api/docs` — available in development only.
Auth: JWT Bearer token obtained from `POST /auth/login`.

## Key conventions

- Queue names → `QueueName` enum in `api/src/modules/queues/QueueName.ts`
- Cache keys → `CacheKey` helpers in `api/src/modules/cache/CacheKey.ts`
- Prisma enums (`EventType`, `BadgeType`, `Role`) imported directly from `@prisma/client`
- All scoring happens synchronously inside a Prisma transaction in `ScoringService.processEvent`
- Webhook endpoints (`POST /webhooks/:provider`) are `@Public()` and guarded by `WebhookGuard` (HMAC)
- `RESEND_API_KEY` is optional — app starts without it, logs a warning, skips email sends but still writes `NotificationLog`
