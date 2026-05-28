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

# ── Colours (ANSI-C quoting — bash 3.2+ / macOS safe) ───────────────────────
BOLD=$'\033[1m'
DIM=$'\033[2m'
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'
NC=$'\033[0m'  # No Colour / Reset

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()  { printf "${BOLD}${CYAN}[Rally]${NC} %s\n" "$*"; }
ok()   { printf "  ${GREEN}✓${NC} %s\n" "$*"; }
warn() { printf "  ${YELLOW}⚠${NC} %s\n" "$*"; }
err()  { printf "  ${RED}✗ %s${NC}\n" "$*" >&2; }
dim()  { printf "  ${DIM}%s${NC}\n" "$*"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
SEED=false
RESET_DATA=false
STOP=false

for arg in "$@"; do
  case $arg in
    --seed)   SEED=true ;;
    --reset)  RESET_DATA=true ;;
    --stop)   STOP=true ;;
    --help|-h)
      printf "Usage: ./start.sh [--seed] [--reset] [--stop]\n\n"
      printf "  (no flags)  Start infrastructure + API + Web\n"
      printf "  --seed      Run migrations + seed demo data before starting (first run)\n"
      printf "  --reset     Wipe gamification data, re-seed, then start\n"
      printf "  --stop      Stop Docker infrastructure and exit\n"
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
    err "Required tool not found: $1 — install it and try again."
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
    ok "api/.env created (edit it if you need custom secrets)"
  else
    err "api/.env not found and no .env.example to copy from"
    exit 1
  fi
fi

# ── --stop ────────────────────────────────────────────────────────────────────
if [ "$STOP" = true ]; then
  log "Stopping Docker infrastructure..."
  docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" down
  ok "Infrastructure stopped"
  exit 0
fi

# ── Start infrastructure ──────────────────────────────────────────────────────
log "Starting Docker infrastructure (Postgres + Redis)..."
docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" up -d

# Poll until Postgres responds
log "Waiting for Postgres to be ready..."
for i in $(seq 1 30); do
  if docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" \
       exec -T db pg_isready -U postgres -q 2>/dev/null; then
    break
  fi
  sleep 1
done
ok "Postgres + Redis ready"

# ── Install dependencies ──────────────────────────────────────────────────────
log "Installing dependencies..."

if [ ! -d "$SCRIPT_DIR/api/node_modules" ]; then
  dim "npm install in api/ ..."
  (cd "$SCRIPT_DIR/api" && npm install --silent)
fi
ok "api/ dependencies ready"

if [ ! -d "$SCRIPT_DIR/web/node_modules" ]; then
  dim "npm install in web/ ..."
  (cd "$SCRIPT_DIR/web" && npm install --silent)
fi
ok "web/ dependencies ready"

# ── Seed (--seed or --reset) ──────────────────────────────────────────────────
if [ "$SEED" = true ] || [ "$RESET_DATA" = true ]; then
  log "Running database migrations..."
  (cd "$SCRIPT_DIR/api" && npx prisma migrate deploy)
  ok "Migrations applied"

  log "Seeding users + scoring config..."
  (cd "$SCRIPT_DIR/api" && npm run db:seed)
  ok "Base seed complete"

  log "Replaying demo events through the scoring engine..."
  (cd "$SCRIPT_DIR/api" && npm run demo:seed:clean)
  ok "Demo seed complete"
fi

# ── Cleanup on Ctrl+C ─────────────────────────────────────────────────────────
API_PID=""
WEB_PID=""

cleanup() {
  printf "\n"
  log "Shutting down..."
  if [ -n "$API_PID" ]; then
    kill "$API_PID" 2>/dev/null || true
    ok "API stopped"
  fi
  if [ -n "$WEB_PID" ]; then
    kill "$WEB_PID" 2>/dev/null || true
    ok "Web stopped"
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Launch API ────────────────────────────────────────────────────────────────
log "Starting NestJS API..."
(
  cd "$SCRIPT_DIR/api"
  npm run start:dev 2>&1 | while IFS= read -r line; do
    printf "${CYAN}[api]${NC} %s\n" "$line"
  done
) &
API_PID=$!

# ── Wait for API health ───────────────────────────────────────────────────────
log "Waiting for API to be ready..."
API_UP=false
for i in $(seq 1 60); do
  if curl -sf http://localhost:4000/health >/dev/null 2>&1; then
    API_UP=true
    break
  fi
  sleep 1
done

if [ "$API_UP" = true ]; then
  ok "API ready → http://localhost:4000"
  ok "Swagger  → http://localhost:4000/api-docs"
else
  warn "API did not respond in 60s — check [api] logs above"
fi

# ── Launch Web ────────────────────────────────────────────────────────────────
log "Starting Next.js web..."
(
  cd "$SCRIPT_DIR/web"
  npm run dev 2>&1 | while IFS= read -r line; do
    printf "${YELLOW}[web]${NC} %s\n" "$line"
  done
) &
WEB_PID=$!

# ── Ready banner ──────────────────────────────────────────────────────────────
sleep 2
printf "\n"
printf "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${BOLD}${GREEN}  Rally is running!${NC}\n"
printf "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "\n"
printf "  ${CYAN}Dashboard${NC}  →  http://localhost:3000\n"
printf "  ${CYAN}API${NC}        →  http://localhost:4000\n"
printf "  ${CYAN}Swagger${NC}    →  http://localhost:4000/api-docs\n"
printf "  ${CYAN}Health${NC}     →  http://localhost:4000/health\n"
printf "\n"
printf "  ${DIM}Demo: alice@demo.com / Demo1234!  (rep)${NC}\n"
printf "  ${DIM}       manager@demo.com / Demo1234!  (manager)${NC}\n"
printf "\n"
printf "  ${DIM}Press Ctrl+C to stop all services${NC}\n"
printf "\n"

# ── Keep running ──────────────────────────────────────────────────────────────
wait
