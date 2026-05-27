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
| Notifications | `GET /admin/notifications?limit&offset&type&from&to` | Email templates “send history” + gallery UX | done |
| Email templates | `GET /admin/emails/templates` | `/admin/emails` registry + preview | done |
| Email templates | `POST /admin/emails/:templateId/send-test` | “Send test email” buttons | done |
| Leaderboard | `GET /leaderboard` entries include `lastWeekRank` + `rankDelta` | Rank movement chips in UI | done |
| Manager overview | `GET /admin/overview` | `/admin/dashboard` aggregates (top3, at-risk, email demo metadata) | done |
| Manager reps | `GET /admin/reps` includes `eventCount` + `lastActivityAt` | Reps table “Events” and recency | done |
| Levels config | `GET /config/levels` (or equivalent level fields in `/users/:id`) | rep screens needing level labels/thresholds | done |

## Implementation notes (current)

- All manager-role HTTP APIs live under `/admin/*` via `AdminModule` (no AppModule-registered admin controllers).
- `POST /admin/emails/:templateId/send-test` currently supports sending only POC templates: `BADGE_UNLOCK` and `STREAK_RISK`. Other templateIds return `accepted: false`.
- `GET /admin/overview` returns `top3` from weekly leaderboard and `atRisk` from streak-risk candidates (`last 24h` + `currentStreak >= 2`).
