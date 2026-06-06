# Phase 2 Finding — Normalization Sanity Sweep

**Verdict: ⚠ ISSUES**
**Date:** 2026-06-06
**Auditor:** Claude (sandbox) + Bugra (SQL pull)
**Scope:** 32 active indicators × normalize_low / normalize_high / normalize_invert vs actual observed data ranges from `indicator_values`

## Summary

| Severity | Count | Action |
|---|---|---|
| CRITICAL | 2 | Must fix before UI sprint — published numbers misleading |
| HIGH | 9 | Bound expansion needed — high-end signal saturating |
| MEDIUM | 7 | Bound tweak — low-end signal clamping (less harmful) |
| FALSE FLAG | 3 | Script-side; actual indicator OK |
| OK | 11 | No action |

The audit caught two real production bugs and 16 bound-tuning opportunities.
The two CRITICAL items distort published composites today.

## CRITICAL Findings

### C1. inflation_rate — bound 15%, observed up to 220%

Stored bounds say 2% inflation = 0 stress, 15% inflation = 100 stress.
Reality: TR ~58%, AR ~220%. All values above 15 clamp to 100. As a result:

- TR composite "inflation_rate" stress = 100 (same as AR's 100)
- AR's 220% inflation is **indistinguishable** from a country with 16%
- BR (~4-5%), DE/JP (~2%) sit at the low end but the signal is squished

**Impact on composite:** Argentina's macro situation cannot be expressed.
Turkey's lira crisis cannot be expressed in nuance. Both countries
register the same economic-meta stress contribution from inflation.

**Recommended fix:**
Expand high bound. Two options:

1. **Linear, generous high:** `normalize_high = 30` (or 50) → still
   imperfect but TR (58%) gets distinct stress from AR (220%, still
   clamped at 100). Simple migration.
2. **Log-scale normalization:** `stress = log(value) / log(MAX)` —
   captures full range but breaks the linear semantics of the rest of
   the system. Heavier refactor.

Recommendation: Option 1, set `normalize_high = 30`. Documents the
"hyperinflation = 100" interpretation cleanly. Add a migration.

### C2. ai_job_anxiety — ZERO spread across countries

Every one of 25 countries has indicator value 79.8 and normalized 99.7.
Spread = 0.0 → indicator has **no discriminating power**.

Root cause: `socialFeedComputedAdapter` computes one global value from
`social_feed_curated` relevance scores and returns the same value for
every country. The adapter was designed as a placeholder when real
per-country sentiment data was unavailable.

**Impact:** Every country's Technological meta-index gets the same
+99.7 contribution from this indicator. The variance in Technological
meta scores between countries comes entirely from other 3 indicators
(automation_exposure, digital_addiction, screen_time). So the
Technological meta is partially flat.

**Recommended fix:**
This is an adapter-design issue, not a bound issue. Three paths:

1. **Disable ai_job_anxiety** (`active = false` in indicators table)
   until per-country data is available. Cleanest. Technological meta
   drops to 3 indicators — still meaningful.
2. **Source per-country sentiment data** from a real provider
   (Reddit-only scoped per country, Twitter sentiment per country, etc.)
   — non-trivial, weeks of work.
3. **Re-design social_feed adapter** to bucket per-country by content
   tags. Medium complexity.

Recommendation: Path 1 (disable) for now. Open a follow-up task for
Path 3 in audit_findings/ as a future enhancement.

## HIGH Findings (9 — bound expansion needed)

These all have high-bound saturation: top-stress countries indistinguishable
from each other. Each was caught by `CLAMPED_HIGH (obs_max > high)`.

| Indicator | Current bound | Observed max | Recommended new high |
|---|---|---|---|
| unemployment_rate | 12 | 32.4 | **20** (ZA territory; TR, ES, GR cap here) |
| youth_unemployment_rate | 25 | 60.0 | **45** |
| homicide_rate | 30 | 43.7 | **40** |
| suicide_rate | 25 | 27.5 | **30** |
| gov_debt_pct_gdp | 150 | 175.6 | **200** (JP territory) |
| water_stress | 80 | 90 | **95** |
| air_pollution | 50 | 53.3 | **60** (IN cap) |
| housing_affordability | 12 | 14.8 | **16** |
| screen_time | 8 | 9.7 | **10** |

Migration 021 should re-set all of these. Each is a one-line
`UPDATE indicators SET normalize_high = ... WHERE id = ...`.

## MEDIUM Findings (7 — low-bound clamping)

These clamp low-end at 0 stress; less harmful but reduces dynamic range
for "doing well" countries. Some may be intentional editorial choices.

| Indicator | Current low | Observed min | Note |
|---|---|---|---|
| gini_index | 25 | 23.7 | NO at 23.7 → currently 0 stress, very close to bound |
| divorce_rate | 1.5 | 0.1 | ZA, IN religious/cultural patterns clamp at 0 |
| adolescent_fertility_rate | 5 | 0.53 | JP, KR at 0.5-2 clamp at 0 |
| alcohol_consumption_per_capita | 3 | 1.69 | TR (Islamic) at 1.7 → 0 stress |
| age_dependency_ratio | 40 | 21.77 | IN, MX at 22 → 0; range too wide |
| work_life_balance | 1 | 0.4 | NL at 0.4% clamps at 0 |
| life_satisfaction | 4 (inverted high) | 4.0 | IN at floor; signal still 15-100 (OK) |

Action: bring all lows down by 1-2 units OR accept as editorial floor.
Less urgent than CRITICAL/HIGH.

## FALSE FLAG (3 — script logic bug)

These showed up as `CLAMPED_HIGH_INV` but the analysis logic is wrong
for the inverted case where obs_min sits between bounds.

| Indicator | Why script flagged | Actual state |
|---|---|---|
| gdp_growth_rate | obs_min -1.34 < stress_low (4) | NOT clamped (between bounds) |
| life_expectancy | obs_min 66.31 < stress_low (82) | NOT clamped at 100 (66 is mid-range). DOES clamp at 0 for SE/CH/JP at 82+ (low-end-clamp, MEDIUM not HIGH) |

Action: fix `audit_phase2_normalization.py` invert logic in a future
audit run. The 3 false flags don't change Phase 2 verdict.

## Recommended Action Plan

### Immediate (Sprint into next backend turn)

1. **Migration 021:** expand 9 HIGH bounds (single SQL with INSERT … ON
   CONFLICT UPDATE shape). Trigger cron after migration; verify new
   composites land within meaningful range.
2. **Migration 022:** disable `ai_job_anxiety` (`UPDATE indicators SET
   active=false WHERE id='ai_job_anxiety'`). Technological meta drops
   to 3 indicators.
3. **Migration 023 (or part of 021):** expand `inflation_rate` high to
   30.

### Follow-up (after audit completes)

4. Open backlog item: real per-country AI anxiety source
5. Migration 024 (optional): retune MEDIUM low bounds
6. Fix script invert logic (cosmetic)
7. Re-run cron after each migration; verify composites
8. Re-run Phase 2 audit query; confirm OK count rises

## Why this matters

Today, when a reader compares Türkiye's composite (54.1) to Argentina's
(52.4) they're looking at a representation where Argentina's
catastrophic 220% inflation is rendered as the same single stress unit
as Türkiye's 58%. The reader cannot recover the underlying difference
from the composite alone. The Technological meta-index for every
country contains an identical +99.7 phantom contribution from
ai_job_anxiety. Both of these are correctable today.

## Next Phase

Phase 1 — Adapter Truth Test. Spot-check actual values from World Bank
+ Eurostat upstream APIs against what we have in indicator_values.
Verdict will tell us whether the bounds problem is compounded by a
data-ingestion problem, or whether the bounds problem is the only
data-pipeline issue.
