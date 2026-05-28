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