#!/usr/bin/env bash
#
# J2 Content Batch Fill — bir oturumda tüm content factory'leri tetikler.
#
# Usage:
#   bash scripts/fire_content_batches.sh
#
# Prereqs:
#   - PD running on http://localhost:3001
#   - PD .env: THI_PULSE_AUTO_PUBLISH=true, THI_PULSE_LOCALES=en,tr
#   - PD .env: THI_SUPABASE_SERVICE_KEY=<real key>
#
# Beklenen toplam süre: ~75 dk
#   - 10 glossary batch × ~4 dk = ~40 dk
#   - 5 research article × ~5 dk = ~25 dk
#   - 1 per-country pulse batch (5 ülke × 2 locale) × ~30 sn = ~5 dk
#
# Batch'ler sıralı çalışır (paralel değil) — Claude CLI rate limit ve
# Supabase write ordering için. Bir batch fail ederse log basar, devam eder.

set -u
PD="${PD:-http://localhost:3001}"

LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/$(date +%Y%m%d_%H%M%S).log"

# ── helpers ──
BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'

log()  { echo -e "$@" | tee -a "$SESSION_LOG"; }
hr()   { log "${CYAN}────────────────────────────────────────────────────────────${RESET}"; }
step() { log "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()   { log "${GREEN}✓ $*${RESET}"; }
warn() { log "${YELLOW}⚠ $*${RESET}"; }
fail() { log "${RED}✗ $*${RESET}"; }

post_json() {
  local endpoint="$1"; local body="$2"; local label="$3"
  step "$label"
  log "  POST $PD$endpoint"
  log "  body: $body"
  local started=$(date +%s)
  local resp
  resp=$(curl -sS --max-time 600 -X POST "$PD$endpoint" \
    -H "Content-Type: application/json" \
    -d "$body" 2>&1) || { fail "curl failed: $resp"; return 1; }
  local elapsed=$(( $(date +%s) - started ))

  # Try to pretty-print; fall back to raw
  if echo "$resp" | python3 -m json.tool >/dev/null 2>&1; then
    log "  ${elapsed}s elapsed. Response:"
    echo "$resp" | python3 -m json.tool | sed 's/^/    /' | tee -a "$SESSION_LOG"
  else
    warn "  Non-JSON response (${elapsed}s):"
    log "  $resp"
  fi

  # Best-effort success detection
  if echo "$resp" | grep -q '"success": true\|"success":true'; then
    ok "$label completed."
  elif echo "$resp" | grep -q '"error"'; then
    fail "$label returned an error (see body above)."
  fi
}

# ── connectivity check ──
log "${BOLD}J2 Content Batch Fill — $(date)${RESET}"
log "PD endpoint: $PD"
log "Session log: $SESSION_LOG"
hr
step "Connectivity check"
if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  fail "PD not reachable at $PD. Start PD first (npm run dev:server) and rerun."
  exit 1
fi
ok "PD reachable."

# ────────────────────────────────────────────────────────────
# 1) GLOSSARY — 10 batches (5 en + 5 tr) → ~80 entries
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 1: GLOSSARY (10 batches) ──${RESET}"

post_json /api/glossary/run \
  '{"locale":"en","countryCode":"global","limit":8}' \
  "Glossary 01/10 — global/en"

post_json /api/glossary/run \
  '{"locale":"en","countryCode":"US","countryName":"United States","limit":8}' \
  "Glossary 02/10 — US/en"

post_json /api/glossary/run \
  '{"locale":"en","countryCode":"GB","countryName":"United Kingdom","limit":8}' \
  "Glossary 03/10 — GB/en"

post_json /api/glossary/run \
  '{"locale":"en","countryCode":"DE","countryName":"Germany","limit":8}' \
  "Glossary 04/10 — DE/en"

post_json /api/glossary/run \
  '{"locale":"en","countryCode":"JP","countryName":"Japan","limit":8}' \
  "Glossary 05/10 — JP/en"

post_json /api/glossary/run \
  '{"locale":"tr","countryCode":"global","limit":8}' \
  "Glossary 06/10 — global/tr"

post_json /api/glossary/run \
  '{"locale":"tr","countryCode":"US","countryName":"ABD","limit":8}' \
  "Glossary 07/10 — US/tr"

post_json /api/glossary/run \
  '{"locale":"tr","countryCode":"GB","countryName":"Birleşik Krallık","limit":8}' \
  "Glossary 08/10 — GB/tr"

post_json /api/glossary/run \
  '{"locale":"tr","countryCode":"DE","countryName":"Almanya","limit":8}' \
  "Glossary 09/10 — DE/tr"

post_json /api/glossary/run \
  '{"locale":"tr","countryCode":"JP","countryName":"Japonya","limit":8}' \
  "Glossary 10/10 — JP/tr"

# ────────────────────────────────────────────────────────────
# 2) RESEARCH — 5 articles
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 2: RESEARCH (5 articles) ──${RESET}"

post_json /api/research/run \
  '{"locale":"en","countryCode":"global"}' \
  "Research 1/5 — global/en"

post_json /api/research/run \
  '{"locale":"en","countryCode":"US","countryName":"United States"}' \
  "Research 2/5 — US/en"

post_json /api/research/run \
  '{"locale":"en","countryCode":"GB","countryName":"United Kingdom"}' \
  "Research 3/5 — GB/en"

post_json /api/research/run \
  '{"locale":"en","countryCode":"DE","countryName":"Germany"}' \
  "Research 4/5 — DE/en"

post_json /api/research/run \
  '{"locale":"en","countryCode":"JP","countryName":"Japan"}' \
  "Research 5/5 — JP/en"

# ────────────────────────────────────────────────────────────
# 3) PER-COUNTRY PULSE — 1 batch (5 ülke × 2 locale)
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 3: PER-COUNTRY PULSE (5 ülke × 2 locale = 10 pulse) ──${RESET}"

post_json /api/thi/generate-country-pulse \
  '{"locales":["en","tr"],"publish":true}' \
  "Per-country Pulse batch"

# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}${GREEN}All phases done.${RESET}"
log "Full session log: $SESSION_LOG"
log "\nNext: rerun scripts/content_audit.sql in Supabase to verify growth."
