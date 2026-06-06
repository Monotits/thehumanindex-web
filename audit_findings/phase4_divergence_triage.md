# Phase 4 Finding — Cross-Source Divergence Triage

**Verdict: ✓ PASSED — 4 warnings classified, all are EXPECTED methodology differences EXCEPT temperature**
**Date:** 2026-06-06
**Auditor:** Claude (cross-phase synthesis)

## Background

The cron-v2 pipeline runs cross-source validation on every (country, indicator)
pair where 2+ adapters return a value. Persisted to `cross_source_validations`.
`v_recent_divergence_streaks` surfaces pairs with ≥2 non-OK runs in the last
10 (over 30 days). Current state (from earlier audit pulls):

| Country | Indicator | Divergent runs | Avg % when warning |
|---|---|---|---|
| DE | gini_index | 2/2 | 11.3 |
| IT | gini_index | 2/2 | 10.1 |
| NO | gini_index | 2/2 | 11.2 |
| PL | gini_index | 2/2 | 13.5 |

Plus a new one surfaced by Phase 5 (TR data dump):

| TR | temperature_anomaly | NASA 0.012 vs Berkeley 1.5 → ~12,300% spread |

## Triage

### gini_index — WB vs Eurostat methodology

**Source comparison:**
- World Bank: Gini computed from harmonized national household surveys
  using their own methodology (varies by country, often based on
  per-capita income net of taxes/transfers)
- Eurostat (EU-SILC): equivalised disposable household income for all
  EU+ countries, harmonized methodology since 2003

The 10-13% spread is **structural** — Eurostat tends to report ~3-5
Gini points higher than WB for the same year because:
1. EU-SILC uses equivalised income (household-size adjusted)
2. WB sometimes reports per-capita with different definitions
3. Reference year reporting differs (WB lags by 1-2 years)

**Verdict:** ACCEPT. Document methodology footnote in UI. Both values
are correct under their own assumptions; users should know which one
the composite uses. The orchestrator routes Eurostat as primary for
EU countries (which is the methodologically consistent choice for
within-EU comparison), but transparency endpoint shows both.

**Action:** No fix. Add UI note "EU countries use Eurostat EU-SILC
gini methodology; non-EU use World Bank-collected household survey
gini, which can differ by 3-5 points."

### temperature_anomaly — NASA vs Berkeley Earth

**Source comparison:**
- nasaGiss: returns the GISTEMP global mean anomaly (one value applied
  to all 25 countries)
- referenceSeed: Berkeley Earth per-country anomaly (e.g., TR = 1.5°C
  in 2024)

The 12,300% spread on TR is NOT methodology — it's that NASA value
(0.012) is from a monthly slice that happened to be near baseline,
while Berkeley Earth is the annual country-specific anomaly. The two
shouldn't be compared at all — they measure different things.

**Verdict:** BUG. Already in task #84. Fix by removing temperature_anomaly
from nasaGissAdapter.providedIndicators, OR by re-ordering the ADAPTERS
array in orchestrator.ts to put referenceSeed first.

After fix, NASA will no longer route as primary for temperature, and
the divergence will disappear (only one source per pair).

## Verdict Summary

| Divergence | Classification | Action |
|---|---|---|
| DE gini WB vs Eurostat | Real methodology | Accept + document |
| IT gini WB vs Eurostat | Real methodology | Accept + document |
| NO gini WB vs Eurostat | Real methodology | Accept + document |
| PL gini WB vs Eurostat | Real methodology | Accept + document |
| TR temperature NASA vs Berkeley | Adapter routing bug | Fix per task #84 |

4/5 divergences are documented methodology disagreements (correct
behavior; system is doing what it claims). 1/5 is a routing bug
already open as task #84.

## Process Validation

Phase 4 confirms the cross-source validation system is working:
- The 4 gini warnings are real and persistent (≥2/2 runs)
- The validation pipeline catches them
- The new transparency API surfaces them per-country
- The methodology difference is documentable and editorially fixable

Audit conclusion: cross_source_validations table + view is doing what
it's meant to do, and the warnings it raises are interpretable.

## Next Phase

Phase 8 — Edge Cases. Test failure modes: all adapters fail, missing
(country, indicator), low confidence, invalid country code, malformed
slug. Verify system doesn't crash and produces meaningful 404s/errors.
