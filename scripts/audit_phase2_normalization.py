#!/usr/bin/env python3
"""
Phase 2 Audit: Normalization Sanity Sweep

Reads the JSON output of audit_phase2_normalization.sql and assigns a
verdict per indicator. Surfaces bounds-vs-observed-data mismatches:

  - CLAMPED_HIGH: observed max exceeds high bound (constant 100 stress)
  - CLAMPED_LOW:  observed min below low bound (constant 0 stress)
  - NO_COVERAGE:  bounds entirely above or below observed data
  - TIGHT_RANGE:  normalized range < 15 (low discriminating signal)
  - INVERT_SUSPECT: bound configuration looks reversed
  - OK:           range sits inside bounds and produces useful spread

Outputs a per-indicator table + summary counts + findings list.

Usage:
  python3 scripts/audit_phase2_normalization.py < phase2_result.json
  python3 scripts/audit_phase2_normalization.py phase2_result.json
"""

import json
import sys
from collections import Counter

TIGHT_RANGE_THRESHOLD = 15
CLAMP_TOLERANCE_PCT = 5  # observed max can be 5% above bound and still OK (rounding)

def load_rows():
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            return json.load(f)
    return json.load(sys.stdin)

def classify(row):
    issues = []
    norm_low = float(row['norm_low'])
    norm_high = float(row['norm_high'])
    inverted = row['inverted']
    obs_min = float(row['obs_min']) if row['obs_min'] is not None else None
    obs_max = float(row['obs_max']) if row['obs_max'] is not None else None
    nv_min = float(row['norm_min']) if row['norm_min'] is not None else None
    nv_max = float(row['norm_max']) if row['norm_max'] is not None else None

    if obs_min is None or obs_max is None:
        return ['NO_DATA']

    # Bound order sanity
    if not inverted and norm_low > norm_high:
        issues.append('INVERT_SUSPECT (low>high but not inverted)')
    if inverted and norm_low < norm_high:
        # With invert=true, low value should map to high stress.
        # The code clamps to min/max of the two so this still works
        # but the convention is to write low > high when inverted.
        pass

    # Compute the "stress bound" — value at which stress=100
    if inverted:
        # invert=true → low value (norm_low) maps to 100 stress
        stress_high_value = min(norm_low, norm_high)
        stress_low_value  = max(norm_low, norm_high)
    else:
        stress_high_value = max(norm_low, norm_high)
        stress_low_value  = min(norm_low, norm_high)

    # Saturation flags
    tol_high = stress_high_value * (1 + CLAMP_TOLERANCE_PCT / 100)
    tol_low  = stress_low_value  * (1 - CLAMP_TOLERANCE_PCT / 100) if stress_low_value > 0 else stress_low_value - 1
    if not inverted:
        if obs_max > tol_high:
            issues.append(f'CLAMPED_HIGH (obs_max {obs_max} > high {stress_high_value})')
        if obs_min < tol_low and stress_low_value > 0:
            issues.append(f'CLAMPED_LOW (obs_min {obs_min} < low {stress_low_value})')
    else:
        # Inverted: high observed → low stress (good direction).
        # Saturation is when obs_min < stress_high_value (= 100 stress)
        # or obs_max > stress_low_value (= 0 stress)
        if obs_min < tol_low:
            issues.append(f'CLAMPED_HIGH_INV (obs_min {obs_min} < {stress_high_value})')

    if obs_max < stress_low_value:
        issues.append('NO_COVERAGE (all observations below bound)')
    if obs_min > stress_high_value and not inverted:
        issues.append('NO_COVERAGE (all observations above high bound)')

    # Spread check
    if nv_min is not None and nv_max is not None:
        spread = nv_max - nv_min
        if spread < TIGHT_RANGE_THRESHOLD:
            issues.append(f'TIGHT_RANGE (normalized spread {spread:.1f})')

    return issues if issues else ['OK']

def main():
    rows = load_rows()
    print(f"\n{'='*98}")
    print(f"Phase 2 Audit — Normalization Sanity Sweep  ({len(rows)} indicators)")
    print(f"{'='*98}\n")

    header = f"{'meta':<14} {'indicator':<32} {'low':>7} {'high':>7} {'inv':>4} {'obs_min':>8} {'obs_max':>8} {'spread':>7}  {'verdict'}"
    print(header)
    print('-' * len(header))

    counts = Counter()
    findings = []
    for r in rows:
        verdict = classify(r)
        primary = verdict[0]
        counts[primary if primary == 'OK' else verdict[0].split(' ')[0]] += 1
        spread = (float(r['norm_max']) - float(r['norm_min'])) if r['norm_max'] and r['norm_min'] else None
        spread_s = f"{spread:.1f}" if spread is not None else '-'
        print(f"{r['meta_index']:<14} {r['id']:<32} "
              f"{r['norm_low']:>7} {r['norm_high']:>7} {str(r['inverted'])[:1]:>4} "
              f"{r['obs_min'] if r['obs_min'] is not None else '-':>8} "
              f"{r['obs_max'] if r['obs_max'] is not None else '-':>8} "
              f"{spread_s:>7}  "
              f"{'; '.join(verdict)}")
        if 'OK' not in verdict[0]:
            findings.append({
                'indicator': r['id'],
                'meta': r['meta_index'],
                'verdict': verdict,
                'context': {
                    'bounds': f"[{r['norm_low']}, {r['norm_high']}] invert={r['inverted']}",
                    'observed': f"[{r['obs_min']}, {r['obs_max']}] avg {r['obs_avg']}",
                    'normalized_spread': spread_s,
                    'n_obs': r['n_observations'],
                    'source': r.get('source_org'),
                },
            })

    print('\n' + '='*98)
    n_ok = counts.get('OK', 0)
    print(f"OK: {n_ok}/{len(rows)}")
    for k, v in counts.most_common():
        if k != 'OK':
            print(f"  {k}: {v}")
    if findings:
        print('\nFINDINGS:')
        for f in findings:
            print(f"\n  [{f['meta']}] {f['indicator']}")
            for issue in f['verdict']:
                print(f"    - {issue}")
            print(f"    bounds:    {f['context']['bounds']}")
            print(f"    observed:  {f['context']['observed']}")
            print(f"    spread:    {f['context']['normalized_spread']}  ({f['context']['n_obs']} obs)")
            if f['context'].get('source'):
                print(f"    source:    {f['context']['source']}")
    else:
        print('\n✓ All indicators classified OK — no bound mismatches or tight ranges.')
    print('='*98 + '\n')

if __name__ == '__main__':
    main()
