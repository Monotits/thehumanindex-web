#!/usr/bin/env bash
#
# Retry the 31 pulse pairs that failed in the previous fire_missing_pulses.sh
# run (22 validation rejects + 9 status=error). With the placeholder regex
# fix (Spanish "todo" no longer matches) and body max 900→1100 word raise,
# most should now pass.
#
# Skips the 10 already-published pairs from the previous run to avoid
# duplicate creation.
#
# PD must be restarted with the latest thi-service.js fixes applied.

set -u
PD="${PD:-http://localhost:3001}"
LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/failed_retry_$(date +%Y%m%d_%H%M%S).log"

# Pairs that failed (validation or error) in the previous fire_missing run.
# Successful pairs (DE/fr, DE/es, ES/pt-br, ES/ja, GB/de, GB/ja, JP/ja,
# US/de, US/es, US/it) are intentionally excluded.
RETRY=(
  BR:fr  BR:pt-br  BR:nl  BR:ja
  DE:pt-br  DE:nl  DE:ja
  ES:de  ES:it  ES:nl
  FR:de  FR:fr  FR:es  FR:pt-br  FR:it  FR:ja
  GB:fr  GB:es  GB:pt-br
  IT:es  IT:pt-br  IT:ja
  JP:es
  NL:pt-br  NL:ja
  TR:es  TR:pt-br  TR:ja
  US:fr  US:pt-br  US:ja
)

BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
log()  { echo -e "$@" | tee -a "$LOG"; }
ok()   { log "  ${GREEN}✓ $*${RESET}"; }
fail() { log "  ${RED}✗ $*${RESET}"; }
warn() { log "  ${YELLOW}⚠ $*${RESET}"; }

log "${BOLD}Retry failed pulses (${#RETRY[@]} pairs) — $(date)${RESET}"
log "Log: $LOG"
if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  log "${RED}PD not reachable.${RESET}"; exit 1
fi

START=$(date +%s); P=0; D=0; F=0; T=0; idx=0
for pair in "${RETRY[@]}"; do
  idx=$((idx+1))
  c="${pair%:*}"; l="${pair#*:}"
  log "\n[${idx}/${#RETRY[@]}] ${BOLD}${c}/${l}${RESET}"
  body="{\"countryCode\":\"$c\",\"locale\":\"$l\",\"publish\":true}"
  t0=$(date +%s)
  resp=$(curl -sS --max-time 180 -X POST "$PD/api/thi/generate-country-pulse" \
    -H "Content-Type: application/json" -d "$body" 2>&1)
  cc=$?
  el=$(( $(date +%s) - t0 ))
  if [ $cc -eq 28 ]; then T=$((T+1)); fail "timeout 180s"; continue; fi
  if [ $cc -ne 0 ]; then F=$((F+1)); fail "curl $cc"; continue; fi
  parsed=$(echo "$resp" | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)
  r=(d.get('results') or [{}])[0]
  print(r.get('status','unknown')+'|'+r.get('title','')[:60])
  if r.get('validation_issues'): print('issues:'+';'.join(r['validation_issues']))
except Exception as e: print(f'parse_error|{e}')
" 2>/dev/null)
  st=$(echo "$parsed" | head -1 | cut -d'|' -f1)
  title=$(echo "$parsed" | head -1 | cut -d'|' -f2)
  issues=$(echo "$parsed" | grep '^issues:' | sed 's/^issues://')
  case "$st" in
    published)         P=$((P+1)); ok "(${el}s) $title" ;;
    validation_failed) D=$((D+1)); warn "(${el}s) val: $issues" ;;
    dry_run_ok)        D=$((D+1)); warn "(${el}s) draft" ;;
    skipped)           warn "(${el}s) skipped" ;;
    *)                 F=$((F+1)); fail "(${el}s) status=$st" ;;
  esac
done

TOT=$(( $(date +%s) - START ))
log "\n${BOLD}── Summary ──${RESET}"
log "  Retried:      ${#RETRY[@]}"
log "  Published:    ${GREEN}${P}${RESET}"
log "  Validation/draft: ${D}"
log "  Failed:       ${F}"
log "  Timeouts:     ${T}"
log "  Wall time:    ${TOT}s ($((TOT/60))min)"
log "Log: $LOG"
