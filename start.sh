#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Rally — Quick Start
#
# Starts the full development stack in one command:
#   • Docker infrastructure (Postgres + Redis)
#   • NestJS API  →  http://localhost:4000
#   • Next.js Web →  http://localhost:3000
#
# Usage:
#   ./start.sh            # start everything (infrastructure already seeded)
#   ./start.sh --seed     # first run: run migrations + seed demo data, then start
#   ./start.sh --reset    # wipe gamification data, re-seed, then start
#   ./start.sh --stop     # stop infrastructure containers and exit
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours (ANSI-C quoting — works on bash 3.2+ / macOS) ───────────────────
BOLD=$'\033[1m'
DIM=$'\033[2m'
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'
RESET=$'\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { printf "%s[Rally]%s %s\n" "${BOLD}${CYAN}" "${RESET}" "$*"; }
ok()   { printf "  %s✓%s %s\n" "${GREEN}" "${RESET}" "$*"; }
warn() { printf "  %s⚠%s %s\n" "${YELLOW}" "${RESET}" "$*"; }
err()  { printf "  %s✗ %s%s\n" "${RED}" "$*" "${RESET}" >&2; }
dim()  { printf "  %s%s%s\n" "${DIM}" "$*" "${RESET}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
SEED=false
RESET_DATA=false
STOP=false

for arg in "$@"; do
  case $arg in
    --seed)  SEED=true ;;
    --reset) RESET_DATA=true ;;
    --stop)  STOP=true ;;
    --help|-h)
      echo "Usage: ./start.sh [--seed] [--reset] [--stop]"
      echo ""
      echo "  (no flags)  Start infrastructure + API + Web"
      echo "  --seed      Run migrations + seed demo data before starting (first run)"
      echo "  --reset     Wipe gamification data, re-seed, then start"
      echo "  --stop      Stop Docker infrastructure and exit"
      exit 0
      ;;
    *)
      err "Unknown argument: $arg  (try --help)"
      exit 1
      ;;
  esac
done

# ── Preflight checks ──────────────────────────────────────────────────────────
log "Checking prerequisites..."

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "Required tool not found: $1"
    printf "  Install it and try again.\n" >&2
    exit 1
  fi
  ok "$1 found"
}

check_cmd docker
check_cmd node
check_cmd npm

NODE_MAJOR=$(node -e "process.stdout.write(process.version.replace('v','').split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node.js 20+ required (found $(node --version))"
  exit 1
fi
ok "Node.js $(node --version) (≥ 20)"

# ── Check .env exists ─────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/api/.env" ]; then
  if [ -f "$SCRIPT_DIR/api/.env.example" ]; then
    warn "api/.env not found — copying from api/.env.example"
    cp "$SCRIPT_DIR/api/.env.example" "$SCRIPT_DIR/api/.env"
    ok "api/.env created — edit it if you need custom secrets"
  else
    err "api/.env not found and no .env.example to copy from"
    exit 1
  fi
fi

# ── --stop flag ───────────────────────────────────────────────────────────────
if $STOP; then
  log "Stopping Docker infrastructure..."
  docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" down
  ok "Infrastructure stopped"
  exit 0
fi

# ── Start infrastructure ──────────────────────────────────────────────────────
log "Starting Docker infrastructure (Postgres + Redis)..."
docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" up -d 2>&1 | grep -v "^$" | dim_lines() { while IFS= read -r line; do dim "$line"; done; }
# Wait for health checks
for i in $(seq 1 20); do
  DB_HEALTHY=$(docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" ps --format json 2>/dev/null \
    | grep -c '"Health":"healthy"' 2>/dev/null || true)
  if [ "$DB_HEALTHY" -ge 2 ] 2>/dev/null; then
    break
  fi
  sleep 1
done
ok "Postgres + Redis running"

# ── Install dependencies ──────────────────────────────────────────────────────
log "Installing dependencies..."

if [ ! -d "$SCRIPT_DIR/api/node_modules" ]; then
  dim "Running npm install in api/..."
  (cd "$SCRIPT_DIR/api" && npm install --silent 2>&1)
fi
ok "api/ dependencies ready"

if [ ! -d "$SCRIPT_DIR/web/node_modules" ]; then
  dim "Running npm install in web/..."
  (cd "$SCRIPT_DIR/web" && npm install --silent 2>&1)
fi
ok "web/ dependencies ready"

# ── First-run / reset seed ────────────────────────────────────────────────────
if $SEED || $RESET_DATA; then
  log "Running database migrations..."
  (cd "$SCRIPT_DIR/api" && npx prisma migrate deploy 2>&1)
  ok "Migrations applied"

  log "Seeding users + scoring config..."
  (cd "$SCRIPT_DIR/api" && npm run db:seed 2>&1)
  ok "Base seed complete"

  log "Replaying demo events through the scoring engine..."
  (cd "$SCRIPT_DIR/api" && npm run demo:seed:clean 2>&1)
  ok "Demo seed complete"
fi

# ── Cleanup on exit ───────────────────────────────────────────────────────────
API_PID=""
WEB_PID=""

cleanup() {
  printf "\n"
  log "Shutting down..."
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null && ok "API stopped"
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null && ok "Web stopped"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Launch API ────────────────────────────────────────────────────────────────
log "Starting NestJS API..."
(cd "$SCRIPT_DIR/api" && npm run start:dev 2>&1 | while IFS= read -r line; do
  printf "%s[api]%s %s\n" "${CYAN}" "${RESET}" "$line"
done) &
API_PID=$!

# ── Wait for API to be ready ──────────────────────────────────────────────────
log "Waiting for API to be ready..."
READY=false
for i in $(seq 1 40); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    READY=true
    break
  fi
  sleep 1
done

if $READY; then
  ok "API is up → http://localhost:4000"
  ok "Swagger  → http://localhost:4000/api-docs"
else
  warn "API health check timed out after 40s — it may still be starting (check logs above)"
fi

# ── Launch Web ────────────────────────────────────────────────────────────────
log "Starting Next.js web..."
(cd "$SCRIPT_DIR/web" && npm run dev 2>&1 | while IFS= read -r line; do
  printf "%s[web]%s %s\n" "${YELLOW}" "${RESET}" "$line"
done) &
WEB_PID=$!

# ── Ready banner ──────────────────────────────────────────────────────────────
sleep 2
printf "\n"
printf "%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n" "${BOLD}${GREEN}" "${RESET}"
printf "%s  Rally is running!%s\n"                            "${BOLD}${GREEN}" "${RESET}"
printf "%s━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n" "${BOLD}${GREEN}" "${RESET}"
printf "\n"
printf "  %sDashboard%s  →  http://localhost:3000\n"  "${CYAN}" "${RESET}"
printf "  %sAPI%s        →  http://localhost:4000\n"  "${CYAN}" "${RESET}"
printf "  %sSwagger%s    →  http://localhost:4000/api-docs\n" "${CYAN}" "${RESET}"
printf "  %sHealth%s     →  http://localhost:4000/health\n"  "${CYAN}" "${RESET}"
printf "\n"
printf "  %sDemo: alice@demo.com / Demo1234! (rep)%s\n"      "${DIM}" "${RESET}"
printf "  %s       manager@demo.com / Demo1234! (manager)%s\n" "${DIM}" "${RESET}"
printf "\n"
printf "  %sPress Ctrl+C to stop all services%s\n" "${DIM}" "${RESET}"
printf "\n"

# ── Wait ──────────────────────────────────────────────────────────────────────
wait
