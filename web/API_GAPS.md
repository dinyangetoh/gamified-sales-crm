# API Gaps Tracker (Rally web UI)

This document tracks backend endpoints/fields required by the Next.js UI so we can close them without frontend stubs.

## Status key
- `pending`: not implemented
- `in_progress`: being implemented
- `done`: implemented and wired to UI

## Gaps

| Area | Endpoint / field | Needed by | Status |
|------|--------------------|------------|--------|
| Auth | `POST /auth/login` response includes `user: { id, name, email, role }` | UI/guards robustness | done |
| Notifications | `GET /manager/notifications?limit&offset&type&from&to` | Email templates “send history” + gallery UX | done |
| Email templates | `GET /manager/emails/templates` | `/manager/emails` registry + preview | done |
| Email templates | `POST /manager/emails/:templateId/send-test` | “Send test email” buttons | done |
| Leaderboard | `GET /leaderboard` entries include `lastWeekRank` + `rankDelta` | Rank movement chips in UI | done |
| Manager overview | `GET /manager/overview` | `/manager/dashboard` aggregates (top3, at-risk, dlq, email demo metadata) | done |
| Manager reps | `GET /manager/reps` includes `eventCount` + `lastActivityAt` | Reps table “Events” and recency | done |
| Levels config | `GET /config/levels` (or equivalent level fields in `/users/:id`) | rep screens needing level labels/thresholds | done |

## Implementation notes (current)

- `POST /manager/emails/:templateId/send-test` currently supports sending only POC templates: `BADGE_UNLOCK` and `STREAK_RISK`. Other templateIds return `accepted: false`.
- `GET /manager/overview` currently returns:
  - `top3` from weekly leaderboard (server-side)
  - `atRisk` based on streak-risk candidates (`last 24h` + `currentStreak >= 2`)
  - `dlq` as best-effort counts from BullMQ failed jobs (notification + ingestion queues)

