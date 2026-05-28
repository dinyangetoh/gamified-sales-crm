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
#   ./start.sh            # normal start
#   ./start.sh --seed     # first run: run migrations + seed demo data first
#   ./start.sh --reset    # wipe gamification data, re-seed, then start
#   ./start.sh --stop     # stop infrastructure containers and exit
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()   { echo -e "${BOLD}${CYAN}[Rally]${RESET} $*"; }
ok()    { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()  { echo -e "${YELLOW}  ⚠${RESET} $*"; }
err()   { echo -e "${RED}  ✗ $*${RESET}" >&2; }
dim()   { echo -e "${DIM}  $*${RESET}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
SEED=false
RESET=false
STOP=false

for arg in "$@"; do
  case $arg in
    --seed)  SEED=true ;;
    --reset) RESET=true ;;
    --stop)  STOP=true ;;
    --help|-h)
      echo "Usage: ./start.sh [--seed] [--reset] [--stop]"
      echo ""
      echo "  (no flags)  Start infrastructure + API + Web"
      echo "  --seed      Run db:migrate + db:seed + demo:seed:clean before starting"
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
    echo -e "  Install it and try again." >&2
    exit 1
  fi
  ok "$1 found"
}

check_cmd docker
check_cmd node
check_cmd npm

NODE_VERSION=$(node -e "process.stdout.write(process.version.replace('v','').split('.')[0])")
if [ "$NODE_VERSION" -lt 20 ]; then
  err "Node.js 20+ required (found v${NODE_VERSION})"
  exit 1
fi
ok "Node.js v$(node --version | tr -d v) (≥ 20)"

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
docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" up -d --wait 2>/dev/null \
  || docker compose -f "$SCRIPT_DIR/docker-compose.dev.yml" up -d
ok "Postgres + Redis running"

# ── Install dependencies ──────────────────────────────────────────────────────
log "Installing dependencies..."

if [ ! -d "$SCRIPT_DIR/api/node_modules" ]; then
  dim "Running npm install in api/..."
  (cd "$SCRIPT_DIR/api" && npm install --silent)
fi
ok "api/ dependencies ready"

if [ ! -d "$SCRIPT_DIR/web/node_modules" ]; then
  dim "Running npm install in web/..."
  (cd "$SCRIPT_DIR/web" && npm install --silent)
fi
ok "web/ dependencies ready"

# ── First-run / reset seed ────────────────────────────────────────────────────
if $SEED || $RESET; then
  log "Running database migrations..."
  (cd "$SCRIPT_DIR/api" && npm run db:migrate)
  ok "Migrations applied"

  log "Seeding users + scoring config..."
  (cd "$SCRIPT_DIR/api" && npm run db:seed)
  ok "Base seed complete"

  if $RESET; then
    log "Resetting gamification data and replaying demo events..."
    (cd "$SCRIPT_DIR/api" && npm run demo:seed:clean)
  else
    log "Replaying demo events..."
    (cd "$SCRIPT_DIR/api" && npm run demo:seed:clean)
  fi
  ok "Demo seed complete"
fi

# ── Cleanup on exit ───────────────────────────────────────────────────────────
API_PID=""
WEB_PID=""

cleanup() {
  echo ""
  log "Shutting down..."
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null && ok "API stopped"
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null && ok "Web stopped"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Launch API ────────────────────────────────────────────────────────────────
log "Starting NestJS API..."
(cd "$SCRIPT_DIR/api" && npm run start:dev 2>&1 | sed "s/^/${CYAN}[api]${RESET} /") &
API_PID=$!

# ── Wait for API to be ready ──────────────────────────────────────────────────
log "Waiting for API to be ready..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    ok "API is up → http://localhost:4000"
    ok "Swagger  → http://localhost:4000/api-docs"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    warn "API did not respond in 30s — check logs above"
  fi
done

# ── Launch Web ────────────────────────────────────────────────────────────────
log "Starting Next.js web..."
(cd "$SCRIPT_DIR/web" && npm run dev 2>&1 | sed "s/^/${YELLOW}[web]${RESET} /") &
WEB_PID=$!

# ── Ready banner ──────────────────────────────────────────────────────────────
sleep 2
echo ""
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${GREEN}  Rally is running!${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${CYAN}Dashboard${RESET}  →  http://localhost:3000"
echo -e "  ${CYAN}API${RESET}        →  http://localhost:4000"
echo -e "  ${CYAN}Swagger${RESET}    →  http://localhost:4000/api-docs"
echo -e "  ${CYAN}Health${RESET}     →  http://localhost:4000/health"
echo ""
echo -e "  ${DIM}Demo login: alice@demo.com / Demo1234! (rep)${RESET}"
echo -e "  ${DIM}           manager@demo.com / Demo1234! (manager)${RESET}"
echo ""
echo -e "  ${DIM}Press Ctrl+C to stop all services${RESET}"
echo ""

# ── Wait ──────────────────────────────────────────────────────────────────────
wait
