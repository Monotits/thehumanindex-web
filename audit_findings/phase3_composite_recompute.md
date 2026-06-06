# Phase 3 Finding — Composite Recompute

**Verdict: ✓ PASSED**
**Date:** 2026-06-06
**Auditor:** Claude (sandbox) + Bugra (SQL pull)

## Scope

Compare the stored `country_composite_scores.score_value` for every active
country to a manual recompute from the underlying 5 `meta_index_scores`
rows, using the formula in `src/lib/indicators/composeMetaIndex.ts`:

```
composite = Σ(meta_value × meta_weight) / Σ(meta_weight for metas with data)
```

With `DEFAULT_META_WEIGHTS`:
- economic 0.25
- social 0.20
- mental 0.20
- technological 0.20
- environmental 0.15

Band thresholds: ≤25 low / ≤45 moderate / ≤65 elevated / ≤80 high / >80 critical.

## Method

1. SQL pull (`scripts/audit_phase3_composite.sql`) → 25 countries × 5 metas = 125 rows
2. Python recompute (`scripts/audit_phase3_recompute.py`) iterates each country,
   reconstructs composite from meta values, compares to stored
3. Drift > 0.1 → flag; band mismatch → flag

## Results

| Code | Stored | Recomp | Δ    | Band     | Status |
|------|-------:|-------:|-----:|----------|--------|
| AE   | 42.7   | 42.71  | 0.01 | moderate | PASS   |
| AR   | 52.4   | 52.44  | 0.04 | elevated | PASS   |
| AU   | 41.7   | 41.68  | -0.02| moderate | PASS   |
| BR   | 45.1   | 45.08  | -0.02| elevated | PASS   |
| CA   | 41.9   | 41.94  | 0.04 | moderate | PASS   |
| CH   | 31.6   | 31.61  | 0.01 | moderate | PASS   |
| DE   | 38.2   | 38.16  | -0.04| moderate | PASS   |
| ES   | 44.1   | 44.13  | 0.03 | moderate | PASS   |
| FR   | 44.0   | 44.00  | 0.00 | moderate | PASS   |
| GB   | 43.1   | 43.07  | -0.03| moderate | PASS   |
| IL   | 43.6   | 43.64  | 0.04 | moderate | PASS   |
| IN   | 41.6   | 41.60  | 0.00 | moderate | PASS   |
| IT   | 41.6   | 41.56  | -0.04| moderate | PASS   |
| JP   | 35.9   | 35.86  | -0.04| moderate | PASS   |
| KR   | 46.9   | 46.86  | -0.04| elevated | PASS   |
| MX   | 44.7   | 44.74  | 0.04 | moderate | PASS   |
| NL   | 34.6   | 34.61  | 0.01 | moderate | PASS   |
| NO   | 29.9   | 29.93  | 0.03 | moderate | PASS   |
| NZ   | 36.7   | 36.66  | -0.04| moderate | PASS   |
| PL   | 41.6   | 41.64  | 0.04 | moderate | PASS   |
| SE   | 35.9   | 35.87  | -0.03| moderate | PASS   |
| SG   | 42.8   | 42.81  | 0.01 | moderate | PASS   |
| TR   | 54.1   | 54.12  | 0.02 | elevated | PASS   |
| US   | 47.0   | 46.99  | -0.01| elevated | PASS   |
| ZA   | 59.8   | 59.77  | -0.03| elevated | PASS   |

**PASS: 25 / 25**
**Max drift:** 0.04 (well below 0.1 threshold)
**Band mismatches:** 0

## Conclusion

The composite computation in production matches the documented formula
exactly. All drift is float-rounding noise from intermediate decimal
rounding between the code's runtime and Python's recompute.

The composite ranking is defensible: ZA, TR, AR top the stress list;
Norway, Switzerland, Netherlands sit at the bottom. The numerical
distance from highest (59.8) to lowest (29.9) is ~30 points, consistent
with the index's intended spread.

## Adjacent observations (not part of this verdict)

- **Band distribution:** 18 moderate, 7 elevated, 0 in low/high/critical.
  Every country is bunched in the 30-60 range. Worth investigating in a
  later audit whether band thresholds are too wide or whether the input
  indicators don't naturally produce extreme aggregates. Out of scope
  here.
- **Confidence range:** 0.94–1.00. Strong indicator coverage across all
  25 countries. Lowest is AE at 0.94 (one indicator missing).
- **All countries have 5/5 metas with data** — no re-normalization
  edge cases exercised in this dataset, but the formula handles it.

## Next phase

Phase 2 — Normalization Sanity Sweep. Verify that each indicator's
`normalize_low` / `normalize_high` / `normalize_invert` bounds are
defensible against observed-data ranges.
