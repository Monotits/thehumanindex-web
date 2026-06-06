#!/usr/bin/env python3
"""
Phase 3 Audit: Composite Recompute

Takes the JSON output of audit_phase3_composite.sql (passed via stdin or
as the first argument) and recomputes every country's composite using
the same formula as src/lib/indicators/composeMetaIndex.ts:

  composite = Σ(meta_value × meta_weight) / Σ(meta_weight for metas with data)

Then compares to the stored composite. Flags drift > 0.1.

Usage:
  python3 scripts/audit_phase3_recompute.py < phase3_result.json
  python3 scripts/audit_phase3_recompute.py phase3_result.json
"""

import json
import sys
from collections import defaultdict

# Must match DEFAULT_META_WEIGHTS in composeMetaIndex.ts
META_WEIGHTS = {
    'economic':       0.25,
    'social':         0.20,
    'mental':         0.20,
    'technological':  0.20,
    'environmental':  0.15,
}

BAND_THRESHOLDS = [
    (25, 'low'),
    (45, 'moderate'),
    (65, 'elevated'),
    (80, 'high'),
    (100, 'critical'),
]

DRIFT_THRESHOLD = 0.1  # >= 0.1 considered a flag

def band_for(score):
    if score is None:
        return None
    for upper, band in BAND_THRESHOLDS:
        if score <= upper:
            return band
    return 'critical'

def load_rows():
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            return json.load(f)
    return json.load(sys.stdin)

def main():
    rows = load_rows()
    # Group rows by country
    by_country = defaultdict(list)
    for r in rows:
        by_country[r['country_code']].append(r)

    print(f"\n{'='*84}")
    print(f"Phase 3 Audit — Composite Recompute  ({len(by_country)} countries)")
    print(f"{'='*84}\n")

    header = f"{'Code':<5} {'Stored':>7} {'Recomp':>7} {'Δ':>6}  {'Stored band':<12} {'Recomp band':<12} {'metas':>5}  {'Status':<10}"
    print(header)
    print('-' * len(header))

    issues = []
    passed = 0

    for code in sorted(by_country.keys()):
        meta_rows = by_country[code]
        stored_composite = meta_rows[0]['stored_composite']
        stored_band = meta_rows[0]['band']
        metas_with_data_stored = meta_rows[0]['metas_with_data']

        weighted_sum = 0.0
        active_weight = 0.0
        active_metas = 0

        for m in meta_rows:
            meta_name = m['meta_index']
            meta_value = m['meta_value']
            if meta_value is None:
                continue
            w = META_WEIGHTS.get(meta_name)
            if w is None:
                issues.append(f"{code}: unknown meta '{meta_name}'")
                continue
            weighted_sum += float(meta_value) * w
            active_weight += w
            active_metas += 1

        if active_weight == 0:
            recomputed = None
            recomputed_band = None
        else:
            recomputed = round(weighted_sum / active_weight, 2)
            recomputed_band = band_for(recomputed)

        stored_f = float(stored_composite) if stored_composite is not None else None
        if stored_f is None or recomputed is None:
            drift = None
        else:
            drift = round(recomputed - stored_f, 2)

        # Status
        if stored_f is None and recomputed is None:
            status = 'NO_DATA'
            passed += 1
        elif drift is None:
            status = 'NULL_MISM'
            issues.append(f"{code}: stored={stored_f}  recomputed={recomputed}")
        elif abs(drift) <= DRIFT_THRESHOLD and stored_band == recomputed_band:
            status = 'PASS'
            passed += 1
        elif abs(drift) <= DRIFT_THRESHOLD and stored_band != recomputed_band:
            status = 'BAND_MISM'
            issues.append(f"{code}: drift OK ({drift}) but band {stored_band}→{recomputed_band}")
        else:
            status = 'DRIFT'
            issues.append(f"{code}: drift {drift} (stored {stored_f} → recomputed {recomputed})")

        print(f"{code:<5} {stored_f or 'null':>7} {recomputed or 'null':>7} "
              f"{drift if drift is not None else '?':>6}  "
              f"{stored_band or '-':<12} {recomputed_band or '-':<12} "
              f"{active_metas}/{metas_with_data_stored:<3}  {status:<10}")

    print('\n' + '='*84)
    print(f"PASS: {passed}/{len(by_country)}  |  Issues: {len(issues)}")
    if issues:
        print('\nFindings:')
        for i in issues:
            print(f"  - {i}")
    else:
        print('\n✓ All composites within ±0.1 drift and same band classification.')
    print('='*84 + '\n')

if __name__ == '__main__':
    main()
