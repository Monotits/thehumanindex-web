#!/usr/bin/env bash
#
# Final attempt at 10 stubborn pulse pairs that failed both previous runs:
#   - 5 validation failures (heading regex was too strict, now relaxed)
#   - 5 status=error (likely Claude long-generation timeouts)
#
# This script uses 300s curl timeout (vs 180s in fire_failed_pulses_retry)
# to give Claude breathing room on the persistent errors. Each call still
# generally completes in 60-90s; the extra margin only matters when Claude
# genuinely takes longer.

set -u
PD="${PD:-http://localhost:3001}"
LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/stubborn_$(date +%Y%m%d_%H%M%S).log"

STUBBORN=(
  # Persistent status=error
  BR:fr  BR:nl  DE:nl  FR:it  GB:fr
  # Heading-validation failures (should pass with relaxed regex)
  BR:pt-br  ES:it  ES:nl  FR:ja  US:fr
)

BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
log()  { echo -e "$@" | tee -a "$LOG"; }
ok()   { log "  ${GREEN}✓ $*${RESET}"; }
fail() { log "  ${RED}✗ $*${RESET}"; }
warn() { log "  ${YELLOW}⚠ $*${RESET}"; }

log "${BOLD}Stubborn pulses retry (${#STUBBORN[@]} pairs, 300s timeout) — $(date)${RESET}"
log "Log: $LOG"
if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  log "${RED}PD not reachable.${RESET}"; exit 1
fi

START=$(date +%s); P=0; D=0; F=0; T=0; idx=0
for pair in "${STUBBORN[@]}"; do
  idx=$((idx+1))
  c="${pair%:*}"; l="${pair#*:}"
  log "\n[${idx}/${#STUBBORN[@]}] ${BOLD}${c}/${l}${RESET}"
  body="{\"countryCode\":\"$c\",\"locale\":\"$l\",\"publish\":true}"
  t0=$(date +%s)
  resp=$(curl -sS --max-time 300 -X POST "$PD/api/thi/generate-country-pulse" \
    -H "Content-Type: application/json" -d "$body" 2>&1)
  cc=$?
  el=$(( $(date +%s) - t0 ))
  if [ $cc -eq 28 ]; then T=$((T+1)); fail "timeout 300s — claude likely stalled"; continue; fi
  if [ $cc -ne 0 ]; then F=$((F+1)); fail "curl exit $cc"; continue; fi
  parsed=$(echo "$resp" | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)
  r=(d.get('results') or [{}])[0]
  print(r.get('status','unknown')+'|'+r.get('title','')[:60])
  if r.get('validation_issues'): print('issues:'+';'.join(r['validation_issues']))
  if r.get('error'): print('err:'+r.get('error')[:100])
except Exception as e: print(f'parse_error|{e}')
" 2>/dev/null)
  st=$(echo "$parsed" | head -1 | cut -d'|' -f1)
  title=$(echo "$parsed" | head -1 | cut -d'|' -f2)
  issues=$(echo "$parsed" | grep '^issues:' | sed 's/^issues://')
  err=$(echo "$parsed" | grep '^err:' | sed 's/^err://')
  case "$st" in
    published)         P=$((P+1)); ok "(${el}s) $title" ;;
    validation_failed) D=$((D+1)); warn "(${el}s) val: $issues" ;;
    error)             F=$((F+1)); fail "(${el}s) error: $err" ;;
    skipped)           warn "(${el}s) skipped" ;;
    *)                 F=$((F+1)); fail "(${el}s) status=$st" ;;
  esac
done

TOT=$(( $(date +%s) - START ))
log "\n${BOLD}── Summary ──${RESET}"
log "  Retried:      ${#STUBBORN[@]}"
log "  Published:    ${GREEN}${P}${RESET}"
log "  Validation:   ${D}"
log "  Failed:       ${F}"
log "  Timeouts:     ${T}"
log "  Wall time:    ${TOT}s ($((TOT/60))min)"
log "Log: $LOG"
