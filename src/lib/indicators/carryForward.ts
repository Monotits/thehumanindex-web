/**
 * Carry-forward for transient source outages.
 *
 * If an adapter fails for a day (World Bank ~1 failure / 30 runs), every
 * indicator it serves drops out of that day's composition and the
 * composite jumps, then jumps back the next day — visible as spikes in the
 * 90-day chart. A failed fetch is not new information, so missing
 * (country, indicator) pairs take their most recent snapshot from the last
 * few days. The observation keeps its own reference date (the stale-data
 * policy still applies) and is tagged `carryforward:<adapter>`.
 */

import { normalizeIndicator, type IndicatorRegistryRow } from './types';
import type { NormalizedMeasurement } from './orchestrator';

export interface SnapshotRow {
  snapshot_date: string;
  country_code: string;
  indicator_id: string;
  raw_value: number | string;
  primary_adapter: string | null;
  reference_date: string | null;
}

/** Pairs (country|indicator) that are active but missing from this run. */
export function missingPairs(
  measurements: NormalizedMeasurement[],
  indicators: IndicatorRegistryRow[],
  countryCodes: string[],
): Set<string> {
  const have = new Set(measurements.filter(m => m.normalizedValue !== null).map(m => `${m.countryCode}|${m.indicatorId}`));
  const out = new Set<string>();
  for (const cc of countryCodes) for (const ind of indicators) {
    const k = `${cc}|${ind.id}`;
    if (!have.has(k)) out.add(k);
  }
  return out;
}

/**
 * Build carried measurements from previous snapshots (any order). For each
 * missing pair the newest snapshot wins. Values are re-normalised with the
 * current registry bounds.
 */
export function carryForward(
  missing: Set<string>,
  snapshots: SnapshotRow[],
  indicators: IndicatorRegistryRow[],
): NormalizedMeasurement[] {
  const byId = new Map(indicators.map(i => [i.id, i]));
  const best = new Map<string, SnapshotRow>();
  for (const s of snapshots) {
    const k = `${s.country_code}|${s.indicator_id}`;
    if (!missing.has(k) || !s.reference_date) continue;
    const cur = best.get(k);
    if (!cur || s.snapshot_date > cur.snapshot_date) best.set(k, s);
  }
  const out: NormalizedMeasurement[] = [];
  for (const [, s] of best) {
    const ind = byId.get(s.indicator_id);
    const raw = Number(s.raw_value);
    if (!ind || !Number.isFinite(raw)) continue;
    out.push({
      countryCode: s.country_code,
      indicatorId: s.indicator_id,
      rawValue: raw,
      referenceDate: s.reference_date!.slice(0, 10),
      normalizedValue: normalizeIndicator(raw, ind),
      adapterId: `carryforward:${s.primary_adapter ?? 'unknown'}`,
      payload: { carried_from_snapshot: s.snapshot_date },
    });
  }
  return out;
}
