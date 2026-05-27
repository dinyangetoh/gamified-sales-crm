## CODING STANDARDS

## File naming

### Class files → PascalCase

```
✅ UserService.ts  ScoringModule.ts  LeaderboardController.ts  GlobalExceptionFilter.ts
❌ userService.ts  scoring.module.ts  leaderboard.controller.ts  global-exception.filter.ts
```

### Utility / config / constant files → camelCase

```
✅ levelUtils.ts  streakUtils.ts  badgeDefinitions.ts  scoringConfig.schema.ts
❌ LevelUtils.ts  StreakUtils.ts  BadgeDefinitions.ts
```

### Test files → `{ClassName}.spec.ts`

**Unit specs live under `test/unit/`**. Domain folder names mirror `api/src/modules/` (drop the `modules/` segment):

```
api/src/modules/scoring/ScoringService.ts  →  test/unit/scoring/ScoringService.spec.ts
api/src/modules/badges/BadgesService.ts    →  test/unit/badges/BadgesService.spec.ts
api/src/modules/cache/DeduplicationService.ts  →  test/unit/cache/DeduplicationService.spec.ts
```

Never place `*.spec.ts` under `api/src/`. Never add `*Controller.spec.ts` under `test/unit/` — test HTTP via E2E.

E2E: `test/e2e/**/*.e2e-spec.ts`

---

## Directory naming

Lowercase; camelCase for multi-word: `api/src/modules/scoring/`, `api/src/common/guards/`

---

## Identifier naming

| Identifier | Convention | Example |
|---|---|---|
| Class | PascalCase | `ScoringService`, `LeaderboardController` |
| Interface / type alias | PascalCase | `CrmAdapter`, `BadgeDefinition` |
| Enum | PascalCase | `EventType`, `BadgeType`, `QueueName` |
| Function / method / variable | camelCase | `processEvent()`, `weekPoints`, `isoWeek` |
| Module-level constant | SCREAMING_SNAKE_CASE | `STREAK_MILESTONES`, `DEDUP_TTL_SECONDS` |
| Env var | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

---

## Project structure

```
api/src/
├── modules/        ← all business logic modules
│   ├── auth/
│   ├── users/
│   ├── events/
│   ├── scoring/
│   ├── badges/
│   ├── leaderboard/
│   ├── webhooks/
│   │   └── adapters/
│   ├── queues/
│   │   └── processors/
│   ├── cache/
│   ├── health/
│   └── notifications/
├── common/         ← global / shared
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   └── interceptors/
├── config/         ← Zod schemas + scoring-config.json
├── prisma/         ← PrismaService
├── AppModule.ts
└── main.ts
```

---

## Prisma schema standards

- PascalCase model names, camelCase field names
- `id String @id @default(uuid())` on every model
- `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on every model (see schema for exceptions like `UserStats` where `userId` is the PK)
- Enums in the Prisma schema are the source of truth — import them from `@prisma/client` throughout the app; do not redeclare them in TypeScript
- Never expose Prisma types (e.g. `Prisma.UserGetPayload<...>`) outside the service that owns the model — map to a plain interface or DTO at the service boundary

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  role         Role     @default(SALES_REP)
  createdAt    DateTime @default(now())
}
```

---

## DTOs

| Shape | Location |
|---|---|
| HTTP request body | `api/src/modules/{module}/dto/` |
| HTTP response shape | `api/src/modules/{module}/dto/` or inline interface |
| Internal service params (not HTTP) | inline interface in the same file |

- One DTO per operation; request DTOs use `class-validator`; response shapes use plain interfaces or classes with `@ApiProperty`
- Never duplicate a request DTO and an internal interface when they are identical

---

## Enums and constants

- Queue names, job names, cache key patterns, and scoring constants are defined as TypeScript enums or `const` objects in dedicated files within the relevant module
- No bare string literals for queue names, job types, or cache keys anywhere in the codebase
- `SCREAMING_SNAKE_CASE` for module-level `const` constants (`STREAK_MILESTONES`, `JWT_EXPIRY`)

---

## Comments

No comments by default. Comment only non-obvious **why**: a hidden constraint, a timing-sensitive operation, a security invariant. No JSDoc on service or repository methods.

---

## Testing

**Every behavior change must include tests.**

| Type | Location | Command | When |
|---|---|---|---|
| **Unit** | `test/unit/**/{ClassName}.spec.ts` | `npm test` | Every `*Service.ts` — pure logic, no HTTP |
| **E2E** | `test/e2e/**/*.e2e-spec.ts` | `npm run test:e2e` | All HTTP controllers — supertest, real DB + Redis |

### Mandatory service specs

Every `*Service.ts` under `api/src/modules/` must have a matching unit spec.

- Mock with **`mock<IInterface>()`** from `jest-mock-extended` — never hand-roll `{ method: jest.fn() }` objects
- Never mock Prisma models in unit tests — use real DB in integration / E2E tests
- Never place `*.spec.ts` under `api/src/`
- Never add `*Controller.spec.ts` under `test/unit/` — test controllers via E2E

### Coverage thresholds

Enforced by Jest (`npm test -- --coverage`):

| Scope | Statements | Branches | Lines |
|---|---|---|---|
| Global | **70 %** | **70 %** | **70 %** |
| `api/src/modules/**/` | **70 %** | **65 %** | **70 %** |

Never lower a threshold.

---

## API documentation (Swagger)

Available at `/api/docs` in development. Disabled in production.

- `@ApiTags('events')` on every controller class
- `@ApiBearerAuth()` on protected controllers
- `@ApiOperation({ summary: '...' })` on each route method
- `@ApiResponse({ status: 200, type: ResponseDto })` for success; `@ApiResponse({ status: 401 })` for auth failures
- Request DTOs: `class-validator` + `@ApiProperty` decorators
- Response DTOs: plain classes or interfaces with `@ApiProperty`

---

## DO NOT

- ❌ `console.log` — use NestJS `Logger` or `nestjs-pino`
- ❌ `process.env.FOO` in application code — use NestJS `ConfigService`
- ❌ Default exports (except queue processors if required by BullMQ)
- ❌ Expose Prisma types (`Prisma.*`, `PrismaClient.*`) outside the service that owns that model
- ❌ Business logic in queue processors — processors delegate to services
- ❌ `new` dependencies inside service methods — use constructor injection
- ❌ Bare string literals for queue names, job types, or Redis cache keys
- ❌ `*.spec.ts` anywhere under `api/src/`
- ❌ `*Controller.spec.ts` under `test/unit/` — use E2E for HTTP behaviour
- ❌ Sensitive fields (passwords, raw webhook payloads) in API response DTOs
- ❌ Cross-module direct repository/Prisma calls — import the other module's service
