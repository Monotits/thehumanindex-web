#!/usr/bin/env bash
#
# Q: Multi-locale content expansion.
#
# Fires content batches for the next-priority locales beyond en/tr:
#   - de (DE)
#   - fr (FR)
#   - es (ES + Latin American audience via MX)
#   - pt-br (BR)
#   - it (IT)
#   - nl (NL)
#
# Prereqs (already in place from J2):
#   - PD running at http://localhost:3001
#   - PD .env: THI_PULSE_AUTO_PUBLISH=true
#   - PD .env: THI_PULSE_LOCALES=en,tr,de,fr,es,pt-br,it,nl  ← UPDATE before run
#   - Migration 020 applied (pulse_active expanded to 10 countries)
#
# Beklenen toplam süre: ~75-90 dk
#   - 12 glossary batches × ~5 dk = ~60 dk
#   - 6 research articles × ~5 dk = ~30 dk
#   - 1 per-country pulse mega-batch (10 countries × 6 locales = up to 60) = ~10 dk
#
# Sequential — Claude CLI rate limit + Supabase write ordering.

set -u
PD="${PD:-http://localhost:3001}"
LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/locale_expansion_$(date +%Y%m%d_%H%M%S).log"

BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
log() { echo -e "$@" | tee -a "$SESSION_LOG"; }
hr()  { log "${CYAN}────────────────────────────────────────────────────────────${RESET}"; }
step(){ log "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()  { log "${GREEN}✓ $*${RESET}"; }
fail(){ log "${RED}✗ $*${RESET}"; }
warn(){ log "${YELLOW}⚠ $*${RESET}"; }

post_json() {
  local endpoint="$1"; local body="$2"; local label="$3"
  step "$label"
  log "  POST $PD$endpoint"
  log "  body: $body"
  local started=$(date +%s)
  local resp
  resp=$(curl -sS --max-time 600 -X POST "$PD$endpoint" \
    -H "Content-Type: application/json" -d "$body" 2>&1) || { fail "curl failed: $resp"; return 1; }
  local elapsed=$(( $(date +%s) - started ))
  if echo "$resp" | python3 -m json.tool >/dev/null 2>&1; then
    log "  ${elapsed}s. Response:"
    echo "$resp" | python3 -m json.tool | sed 's/^/    /' | tee -a "$SESSION_LOG"
  else
    warn "  Non-JSON (${elapsed}s):"; log "  $resp"
  fi
  if echo "$resp" | grep -q '"success": true\|"success":true'; then ok "$label completed."
  elif echo "$resp" | grep -q '"error"'; then fail "$label error (see body)."; fi
}

log "${BOLD}Q: Locale Expansion Batch — $(date)${RESET}"
log "PD endpoint: $PD"
log "Session log: $SESSION_LOG"
hr
step "Connectivity check"
if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  fail "PD not reachable at $PD."; exit 1
fi
ok "PD reachable."

# ────────────────────────────────────────────────────────────
# PHASE 1: GLOSSARY (12 batches)
# Pattern: each native-language locale × its primary country, plus 'global'
# fallback per locale so out-of-country readers still get an entry.
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 1: GLOSSARY (12 batches) ──${RESET}"

# German
post_json /api/glossary/run '{"locale":"de","countryCode":"DE","countryName":"Deutschland","limit":8}' "Glossary 01/12 — DE/de"
post_json /api/glossary/run '{"locale":"de","countryCode":"global","limit":8}' "Glossary 02/12 — global/de"

# French
post_json /api/glossary/run '{"locale":"fr","countryCode":"FR","countryName":"France","limit":8}' "Glossary 03/12 — FR/fr"
post_json /api/glossary/run '{"locale":"fr","countryCode":"global","limit":8}' "Glossary 04/12 — global/fr"

# Spanish (Spain + Latin America via MX)
post_json /api/glossary/run '{"locale":"es","countryCode":"ES","countryName":"España","limit":8}' "Glossary 05/12 — ES/es"
post_json /api/glossary/run '{"locale":"es","countryCode":"MX","countryName":"México","limit":8}' "Glossary 06/12 — MX/es"
post_json /api/glossary/run '{"locale":"es","countryCode":"global","limit":8}' "Glossary 07/12 — global/es"

# Portuguese (Brazil)
post_json /api/glossary/run '{"locale":"pt-br","countryCode":"BR","countryName":"Brasil","limit":8}' "Glossary 08/12 — BR/pt-br"
post_json /api/glossary/run '{"locale":"pt-br","countryCode":"global","limit":8}' "Glossary 09/12 — global/pt-br"

# Italian
post_json /api/glossary/run '{"locale":"it","countryCode":"IT","countryName":"Italia","limit":8}' "Glossary 10/12 — IT/it"

# Dutch
post_json /api/glossary/run '{"locale":"nl","countryCode":"NL","countryName":"Nederland","limit":8}' "Glossary 11/12 — NL/nl"

# Japanese (test: native locale was deferred earlier; now add)
post_json /api/glossary/run '{"locale":"ja","countryCode":"JP","countryName":"日本","limit":8}' "Glossary 12/12 — JP/ja"

# ────────────────────────────────────────────────────────────
# PHASE 2: RESEARCH (6 articles)
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 2: RESEARCH (6 articles, native-locale each) ──${RESET}"

post_json /api/research/run '{"locale":"de","countryCode":"DE","countryName":"Deutschland"}' "Research 1/6 — DE/de"
post_json /api/research/run '{"locale":"fr","countryCode":"FR","countryName":"France"}' "Research 2/6 — FR/fr"
post_json /api/research/run '{"locale":"es","countryCode":"ES","countryName":"España"}' "Research 3/6 — ES/es"
post_json /api/research/run '{"locale":"pt-br","countryCode":"BR","countryName":"Brasil"}' "Research 4/6 — BR/pt-br"
post_json /api/research/run '{"locale":"it","countryCode":"IT","countryName":"Italia"}' "Research 5/6 — IT/it"
post_json /api/research/run '{"locale":"ja","countryCode":"JP","countryName":"日本"}' "Research 6/6 — JP/ja"

# ────────────────────────────────────────────────────────────
# PHASE 3: PER-COUNTRY PULSE (one mega-batch)
# THI_PULSE_LOCALES env on PD should already include all target locales.
# This batch loops all pulse_active countries × all configured locales.
# ────────────────────────────────────────────────────────────
hr
log "\n${BOLD}── PHASE 3: PER-COUNTRY PULSE (mega-batch) ──${RESET}"

post_json /api/thi/generate-country-pulse \
  '{"locales":["de","fr","es","pt-br","it","nl","ja"],"publish":true}' \
  "Per-country Pulse — 7 new locales across all pulse_active countries"

hr
log "\n${BOLD}${GREEN}All phases done.${RESET}"
log "Full session log: $SESSION_LOG"
log "\nNext: rerun scripts/content_audit.sql to verify growth."
