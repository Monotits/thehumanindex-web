#!/usr/bin/env bash
#
# Fire ONLY the 41 (country, locale) pulse pairs missing from the
# locale_expansion batch. Hardcoded list derived from Supabase commentary
# query at 2026-06-05 ~18:30 UTC. Total runtime ~40 min.
#
# Each call: 180s timeout, single (country, locale). PD must be running
# with the CJK validator fix applied (PD restart required after the fix).

set -u
PD="${PD:-http://localhost:3001}"
LOG_DIR="$(dirname "$0")/../.batch_logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/missing_pulses_$(date +%Y%m%d_%H%M%S).log"

# Missing (country, locale) pairs as space-separated COUNTRY:LOCALE tokens
MISSING=(
  BR:fr  BR:pt-br  BR:nl  BR:ja
  DE:fr  DE:es  DE:pt-br  DE:nl  DE:ja
  ES:de  ES:pt-br  ES:it  ES:nl  ES:ja
  FR:de  FR:fr  FR:es  FR:pt-br  FR:it  FR:ja
  GB:de  GB:fr  GB:es  GB:pt-br  GB:ja
  IT:es  IT:pt-br  IT:ja
  JP:es  JP:ja
  NL:pt-br  NL:ja
  TR:es  TR:pt-br  TR:ja
  US:de  US:fr  US:es  US:pt-br  US:it  US:ja
)

BOLD='\033[1m'; GREEN='\033[32m'; RED='\033[31m'; YELLOW='\033[33m'; CYAN='\033[36m'; RESET='\033[0m'
log()  { echo -e "$@" | tee -a "$LOG"; }
ok()   { log "  ${GREEN}✓ $*${RESET}"; }
fail() { log "  ${RED}✗ $*${RESET}"; }
warn() { log "  ${YELLOW}⚠ $*${RESET}"; }

log "${BOLD}Fire missing pulses (${#MISSING[@]} pairs) — $(date)${RESET}"
log "Log: $LOG"

if ! curl -fsS --max-time 5 "$PD/api/thi/status" >/dev/null; then
  log "${RED}PD not reachable.${RESET}"; exit 1
fi

START=$(date +%s)
P=0; D=0; F=0; T=0; idx=0
for pair in "${MISSING[@]}"; do
  idx=$((idx+1))
  c="${pair%:*}"; l="${pair#*:}"
  log "\n[${idx}/${#MISSING[@]}] ${BOLD}${c}/${l}${RESET}"
  body="{\"countryCode\":\"$c\",\"locale\":\"$l\",\"publish\":true}"
  t0=$(date +%s)
  resp=$(curl -sS --max-time 180 -X POST "$PD/api/thi/generate-country-pulse" \
    -H "Content-Type: application/json" -d "$body" 2>&1)
  cc=$?
  el=$(( $(date +%s) - t0 ))
  if [ $cc -eq 28 ]; then T=$((T+1)); fail "timeout 180s"; continue; fi
  if [ $cc -ne 0 ]; then F=$((F+1)); fail "curl $cc: $resp"; continue; fi
  status=$(echo "$resp" | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)
  r=(d.get('results') or [{}])[0]
  print(r.get('status','unknown')+'|'+r.get('title','')[:60])
  if r.get('validation_issues'): print('issues:'+';'.join(r['validation_issues']))
except Exception as e: print(f'parse_error|{e}')
" 2>/dev/null)
  st=$(echo "$status" | head -1 | cut -d'|' -f1)
  title=$(echo "$status" | head -1 | cut -d'|' -f2)
  issues=$(echo "$status" | grep '^issues:' | sed 's/^issues://')
  case "$st" in
    published)        P=$((P+1)); ok "(${el}s) $title" ;;
    validation_failed) D=$((D+1)); warn "(${el}s) validation: $issues" ;;
    dry_run_ok)       D=$((D+1)); warn "(${el}s) draft (no publish)" ;;
    skipped)          warn "(${el}s) skipped" ;;
    *)                F=$((F+1)); fail "(${el}s) status=$st" ;;
  esac
done

TOTAL=$(( $(date +%s) - START ))
log "\n${BOLD}── Summary ──${RESET}"
log "  Attempted:    ${#MISSING[@]}"
log "  Published:    ${GREEN}${P}${RESET}"
log "  Validation/draft: ${D}"
log "  Failed:       ${F}"
log "  Timeouts:     ${T}"
log "  Wall time:    ${TOTAL}s ($((TOTAL/60))min)"
log "Log: $LOG"
