#!/usr/bin/env bash
#
# Tight per-country pulse fire: ONE (country, locale) per curl call.
# Avoids the 480s curl timeout that hit fire_locale_expansion.sh by
# breaking the mega-batch into 70 small calls of ~60s each.
#
# Usage:
#   bash scripts/fire_pulse_one_at_a_time.sh
#
# Optional env:
#   COUNTRIES   — space-separated country codes (default: 10 pulse_active)
#   LOCALES     — space-separated locale codes (default: 7 new locales)
#
# Total runtime: 70 calls × ~60s = ~70 min. Each call has 180s timeout
# (3x margin) so a slow Claude call won't fail. Continues past per-call
# failures with logging.

set -u
PD="${PD:-http://localhost:3001}"
COUNTRIES="${COUNTRIES:-US GB DE TR JP FR ES IT NL BR}"
LOCALES="${LOCALES:-de fr es pt-br it nl ja}"

LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/pulse_one_at_a_time_$(date +%Y%m%d_%H%M%S).log"

BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
log()  { echo -e "$@" | tee -a "$SESSION_LOG"; }
ok()   { log "  ${GREEN}✓ $*${RESET}"; }
fail() { log "  ${RED}✗ $*${RESET}"; }
warn() { log "  ${YELLOW}⚠ $*${RESET}"; }

log "${BOLD}Per-country Pulse — one at a time — $(date)${RESET}"
log "PD: $PD"
log "Countries: $COUNTRIES"
log "Locales:   $LOCALES"
log "Session log: $SESSION_LOG"

if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  log "${RED}PD not reachable. Start with: npm run dev:server${RESET}"
  exit 1
fi

TOTAL=0; PUBLISHED=0; DRAFTED=0; FAILED=0; TIMEOUT=0
START_TS=$(date +%s)

for country in $COUNTRIES; do
  for locale in $LOCALES; do
    TOTAL=$((TOTAL+1))
    log "\n[${TOTAL}/70] ${BOLD}${country}/${locale}${RESET}"
    body="{\"countryCode\":\"$country\",\"locale\":\"$locale\",\"publish\":true}"
    started=$(date +%s)
    resp=$(curl -sS --max-time 180 -X POST "$PD/api/thi/generate-country-pulse" \
      -H "Content-Type: application/json" -d "$body" 2>&1)
    cc=$?
    elapsed=$(( $(date +%s) - started ))

    if [ $cc -eq 28 ]; then
      TIMEOUT=$((TIMEOUT+1))
      fail "timeout after 180s"
      continue
    elif [ $cc -ne 0 ]; then
      FAILED=$((FAILED+1))
      fail "curl exit $cc: $resp"
      continue
    fi

    # Parse status from results[0]
    status=$(echo "$resp" | python3 -c "
import json, sys
try:
  d = json.load(sys.stdin)
  r = (d.get('results') or [{}])[0]
  print(r.get('status', 'unknown'))
except Exception as e:
  print(f'parse_error: {e}')
" 2>/dev/null)
    title=$(echo "$resp" | python3 -c "
import json, sys
try:
  d = json.load(sys.stdin)
  r = (d.get('results') or [{}])[0]
  print(r.get('title', '')[:60])
except Exception:
  print('')
" 2>/dev/null)

    case "$status" in
      published)
        PUBLISHED=$((PUBLISHED+1))
        ok "(${elapsed}s) published — $title"
        ;;
      validation_failed|dry_run_ok)
        DRAFTED=$((DRAFTED+1))
        warn "(${elapsed}s) $status — $title"
        ;;
      skipped)
        warn "(${elapsed}s) skipped"
        ;;
      error)
        FAILED=$((FAILED+1))
        fail "(${elapsed}s) generation error"
        ;;
      *)
        FAILED=$((FAILED+1))
        fail "(${elapsed}s) unexpected status: $status"
        ;;
    esac
  done
done

ELAPSED_TOTAL=$(( $(date +%s) - START_TS ))
log "\n${BOLD}── Summary ──${RESET}"
log "  Total attempts:  $TOTAL"
log "  Published:       ${GREEN}$PUBLISHED${RESET}"
log "  Drafted/failed:  $DRAFTED + $FAILED + $TIMEOUT timeouts"
log "  Total time:      ${ELAPSED_TOTAL}s ($((ELAPSED_TOTAL/60)) min)"
log "Session log: $SESSION_LOG"
