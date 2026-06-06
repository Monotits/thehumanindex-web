#!/usr/bin/env bash
#
# Phase 6: API curl protocol — hits 5 read endpoints, saves JSON to
# /tmp for paste-back. Run from operator machine, paste each block
# back to auditor.
#
# Pair with scripts/audit_phase6_api_consistency.sql which produces
# the canonical "truth" rows from Supabase directly.

set -u
HOST="${HOST:-https://www.thehumanindex.org}"

run() {
  local label="$1"; local url="$2"
  echo "════════════════════════════════════════════════════════════"
  echo "  $label"
  echo "  GET $HOST$url"
  echo "────────────────────────────────────────────────────────────"
  curl -sL --max-time 30 "$HOST$url" | python3 -m json.tool 2>/dev/null \
    || { echo "[parse failed, raw:]"; curl -sL --max-time 30 "$HOST$url"; }
  echo
}

# A. Transparency for US — sample 5 first indicators only
run "A. /api/transparency/US (head only)" \
    "/api/transparency/US"

# B. Trends for US × unemployment_rate
run "B. /api/trends/US/unemployment_rate" \
    "/api/trends/US/unemployment_rate"

# C. Glossary US/en list (alphabetical not API default; we accept order)
run "C. /api/glossary?country=US&locale=en&limit=5" \
    "/api/glossary?country=US&locale=en&limit=5"

# D. Research US/en
run "D. /api/research?country=US&locale=en&limit=5" \
    "/api/research?country=US&locale=en&limit=5"

# E. Pulse latest per country, en
run "E. /api/pulse?latest=per_country&locale=en" \
    "/api/pulse?latest=per_country&locale=en"
