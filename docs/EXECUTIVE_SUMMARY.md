# Rally — Executive Summary

> A gamification engine for Sales CRMs that turns daily activity into measurable momentum.

**Document audience:** CEO / Non-technical stakeholders  
**Companion document:** [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) — for the engineering team

---

## What Is Rally?

Rally is a backend service that sits alongside any Sales CRM and answers one question in real time:

> *"Who is doing the work, and are we recognising them for it?"*

Sales reps log calls, book meetings, advance deals, and close wins inside the CRM they already use. Rally listens to those actions, awards points and badges, tracks streaks, and surfaces a live leaderboard — all without changing how reps work today.

The result is a system that makes the right behaviours visible, the right people celebrated, and the right managers informed — automatically.

---

## The Problem It Solves

Sales teams have a recognition gap. CRMs capture activity but don't reward it. A rep who books 12 meetings this week gets the same CRM view as one who books 2. Managers can pull reports, but the feedback loop is slow and manual.

Rally closes that gap with three mechanisms:

| Mechanism | What it does |
|---|---|
| **Points** | Every meaningful CRM action earns points immediately |
| **Badges** | Milestone achievements (First Win, Consistent Closer, Pipeline Builder) create moments of recognition |
| **Leaderboard** | Weekly ranking creates healthy competition and makes performance visible to the whole team |

---

## What Was Built

The submission delivers a complete, named product called **Rally**, built to production standards across two layers:

### Backend Engine
A secure API service that receives events from any CRM, calculates scores, awards badges, and exposes a leaderboard. It is designed to handle duplicates gracefully (no event is ever scored twice) and prevents common abuse patterns like artificially inflating lead counts.

### Frontend Dashboard — Two Role Views

**For Sales Reps:**
- A personal dashboard showing XP, current rank, live streak, and progress toward the next badge
- A leaderboard with context ("Diana is 60 pts behind you")
- A 30-day activity log with points earned per event

**For Managers:**
- Team overview with KPIs (active reps, win rate, points awarded, badges earned)
- Event mix and level distribution charts for coaching insights
- An activity heatmap showing when the team is most productive
- A read-only rules panel showing exactly how the scoring system works

### Notification Suite (designed, scaffolded)
18 email templates covering the full engagement lifecycle: badge unlocked, level-up, streak at risk, streak broken, near-badge, weekly rep digest, weekly manager digest, end-of-week push, top of the week award.

---

## Key Decisions (Plain English)

### 1 — PostgreSQL as the single source of truth
Every point, badge, and event is stored durably. Nothing is held only in memory. If the service restarts, no data is lost and no event is ever double-counted.

### 2 — Anti-gaming built in from day one
The system rejects duplicate submissions silently (correct — no angry errors for the CRM), caps repetitive low-value actions (max 5 "lead contacted" events score per day), and validates that every webhook came from a trusted CRM source before processing it.

### 3 — Designed in three tiers: POC → MVP → Scale
The current submission is a fully functional proof-of-concept. The architecture documentation defines exactly what changes when the team grows from 8 to 800 reps — no surprises, no rewrites, just planned extensions.

### 4 — CRM-agnostic by design
The integration layer is built as an adapter pattern. HubSpot, Pipedrive, and Salesforce are all documented. HubSpot is wired up (with one stub for user resolution pending live API access). Adding a new CRM requires writing one adapter class, not touching the core engine.

---

## What's Working Now (POC)

| Feature | Status |
|---|---|
| Event ingestion API | ✅ Live |
| Scoring (all 5 event types) | ✅ Live |
| Daily cap (lead_contacted ≤ 5/day) | ✅ Live |
| Idempotency (no duplicate scoring) | ✅ Live |
| XP and Level system (4 tiers) | ✅ Live |
| Badge system (3 badges + 3 extended) | ✅ Live |
| Weekly leaderboard | ✅ Live |
| Streak tracking | ✅ Live |
| Sales Rep dashboard | ✅ Designed & built |
| Manager dashboard | ✅ Designed & built |
| Email notification templates | ✅ Designed, delivery scaffolded |
| Docker (one-command local setup) | ✅ Live |
| HubSpot user resolution | ⚠️ Stub (requires live API key) |
| Pipedrive / Salesforce adapters | 📋 Documented, scoped for MVP |
| Live rule editing (manager UI) | 📋 Scoped for MVP |

---

## Demo

The product ships with demo fixtures: 8 sales reps + 1 manager, **~200 CRM events** across seven weeks (Apr–May 2026), replayed through the real scoring engine so stats, badges, caps, and timeline stay consistent.

**To run the demo locally:**

```bash
# 1. Start the infrastructure (Postgres + Redis)
docker compose up -d

# 2. API — migrate, seed users, replay demo events
cd api && npm install
npm run db:migrate
npm run db:seed
npm run demo:seed:clean
npm run dev

# 3. Start the frontend
cd web && npm install && npm run dev

# 4. Open http://localhost:3000
#    Log in as alice@demo.com or manager@demo.com (password: Demo1234!)
#    Current ISO week for leaderboard: 2026-W22
```

No cloud accounts, no secrets, no configuration required beyond Docker.

---

## Tradeoffs & Honest Scope

| Decision | Why | What it means |
|---|---|---|
| Leaderboard reads from Postgres | Correct for a team of <50, simple to reason about | Will need Redis Sorted Sets at scale (documented migration path exists) |
| Email delivery via Resend | Minimal setup, solid deliverability | Not free at volume; swap for SES/Postmark at scale |
| HubSpot userId resolution is a stub | Requires a live HubSpot API key to test | First task in MVP sprint |
| No live rule editing in this POC | Scope control — the data model supports it | Manager rule editor is the first MVP UI feature |
| Streak uses UTC midnight boundaries | Simple, consistent, fair for most teams | May need per-org timezone configuration in a multi-tenant setup |

---

## What Comes Next (MVP Sprint)

1. **HubSpot owner resolution** — wire up the one remaining stub using the HubSpot Owners API
2. **Manager rule editor** — allow managers to adjust point values and daily caps without a deploy
3. **Email delivery** — activate the scaffolded notification workers (badge unlock, level-up, weekly digest)
4. **Pipedrive adapter** — second CRM integration for the first enterprise customer
5. **Leaderboard caching** — Redis Sorted Sets for sub-10ms leaderboard reads at team sizes >100

---

*Document version: POC | Last updated: 2026-05-27*
