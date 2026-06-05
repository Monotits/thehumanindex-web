/**
 * Indicator Orchestrator (multi-source aware)
 *
 * For each (country, indicator) pair:
 *   1. All registered adapters that provide the indicator are queried.
 *   2. The one with the highest priority (first listed in ADAPTERS) wins as
 *      the "primary" measurement that feeds the composite computation.
 *   3. Secondary adapters' values are kept and compared against the primary
 *      to detect cross-source divergence (e.g., World Bank Gini vs. Eurostat
 *      Gini for Germany). Divergences above the per-pair threshold surface
 *      as warnings on /data-sources.
 *
 * Composition (composeMetaIndex.ts) consumes only the primary measurements.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  IndicatorRegistryRow,
  CountryRow,
  AdapterHealth,
  CrossSourceDivergence,
  normalizeIndicator,
} from './types';
import { worldBankAdapter } from './sources/worldBank';
import { nasaGissAdapter } from './sources/nasaGiss';
import { oecdHousingAdapter } from './sources/oecdHousing';
import { referenceSeedAdapter } from './sources/referenceSeed';
import { socialFeedComputedAdapter } from './sources/socialFeedComputed';
import { eurostatAdapter } from './sources/eurostat';
import { imfAdapter } from './sources/imf';

// Registry of all adapters in PRIORITY ORDER.
// Earlier entries win for the primary measurement when multiple adapters
// provide the same (country, indicator) pair.
// Adapters added later still produce measurements — they become the
// secondary cross-check sources for divergence detection.
const ADAPTERS: IndicatorAdapter[] = [
  // Live primary sources
  eurostatAdapter,              // 11 EU+ countries: unemployment, youth_unemployment, fertility, gini (fresher than WB)
  imfAdapter,                   // 25 countries: inflation_rate (primary), unemployment_rate (cross-source with WB+Eurostat)
  worldBankAdapter,             // 25 countries: 10 indicators
  socialFeedComputedAdapter,    // ai_job_anxiety from social_feed_curated

  // Static seeds (annual refresh)
  oecdHousingAdapter,           // housing_affordability
  referenceSeedAdapter,         // 11 indicators including per-country temperature_anomaly (Berkeley Earth 2024)

  // nasaGissAdapter — DISABLED. Single global value didn't differentiate
  // countries. Replaced by referenceSeed's per-country Berkeley Earth values
  // which capture geographical reality (NH amplification, equatorial drift).
];

// Suppress unused-import warning while we keep nasaGiss source file around
// for future re-enable when we have a per-country live API.
void nasaGissAdapter;

export interface NormalizedMeasurement extends IndicatorMeasurement {
  normalizedValue: number | null;
  adapterId: string;
}

export interface OrchestratorResult {
  /** Primary measurements — one per (country, indicator). Feeds composite. */
  measurements: NormalizedMeasurement[];
  /** Every measurement, including secondary cross-source values. */
  allMeasurements: NormalizedMeasurement[];
  /** Per-adapter health for the run. */
  health: AdapterHealth[];
  /** Cross-source divergences (where >=2 adapters returned a value). */
  divergences: CrossSourceDivergence[];
  /** Indicators with no adapter (rare; surfaces gaps). */
  unroutedIndicators: string[];
}

// Divergence thresholds per indicator (percent). Keep modest — methodological
// differences between sources are expected. Tune as we observe real data.
const DIVERGENCE_THRESHOLDS: Record<string, number> = {
  unemployment_rate: 15,
  youth_unemployment_rate: 15,
  gini_index: 10,
  fertility_rate: 5,
  suicide_rate: 25,        // WHO vs WB methodologies differ historically
  housing_affordability: 20,
  // Anything not listed uses 20 as fallback.
};
const DEFAULT_THRESHOLD = 20;

export async function fetchAllIndicatorValues(
  indicators: IndicatorRegistryRow[],
  countries: CountryRow[],
  perAdapterTimeoutMs = 20_000
): Promise<OrchestratorResult> {
  // Track unrouted: any active indicator that no adapter provides
  const unrouted = new Set(indicators.map(i => i.id));
  for (const adapter of ADAPTERS) {
    adapter.providedIndicators.forEach(id => unrouted.delete(id));
  }

  // Run each adapter in parallel for the indicators it provides ∩ active
  const adapterRuns = await Promise.all(
    ADAPTERS.map(async adapter => {
      const indicatorIds = indicators
        .filter(i => adapter.providedIndicators.has(i.id))
        .map(i => i.id);
      if (indicatorIds.length === 0) {
        return {
          adapter,
          result: {
            measurements: [],
            health: {
              adapter: adapter.id,
              status: 'ok' as const,
              countriesRequested: countries.length,
              countriesReturned: 0,
              indicatorsRequested: 0,
              measurementsReturned: 0,
              durationMs: 0,
              error: null,
            },
          },
        };
      }
      try {
        const result = await adapter.fetchValues({
          countries,
          indicatorIds,
          timeoutMs: perAdapterTimeoutMs,
        });
        return { adapter, result };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[orchestrator] adapter ${adapter.id} threw:`, message);
        return {
          adapter,
          result: {
            measurements: [],
            health: {
              adapter: adapter.id,
              status: 'failed' as const,
              countriesRequested: countries.length,
              countriesReturned: 0,
              indicatorsRequested: indicatorIds.length,
              measurementsReturned: 0,
              durationMs: 0,
              error: message,
            },
          },
        };
      }
    })
  );

  const indicatorById = new Map(indicators.map(i => [i.id, i]));

  // Group measurements by (country, indicator) → array of (adapter, measurement)
  const grouped = new Map<string, NormalizedMeasurement[]>();
  const allMeasurements: NormalizedMeasurement[] = [];

  for (const run of adapterRuns) {
    for (const m of run.result.measurements) {
      const meta = indicatorById.get(m.indicatorId);
      const normalized = meta ? normalizeIndicator(m.rawValue, meta) : null;
      const nm: NormalizedMeasurement = { ...m, normalizedValue: normalized, adapterId: run.adapter.id };
      allMeasurements.push(nm);

      const key = `${m.countryCode}|${m.indicatorId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(nm);
    }
  }

  // Adapter priority lookup (lower index = higher priority)
  const adapterPriority = new Map<string, number>();
  ADAPTERS.forEach((a, i) => adapterPriority.set(a.id, i));

  // Pick primary measurement per pair (highest priority adapter) +
  // compute divergence when multiple adapters returned values.
  const primary: NormalizedMeasurement[] = [];
  const divergences: CrossSourceDivergence[] = [];

  grouped.forEach((measurements, key) => {
    measurements.sort((a, b) => {
      const aP = adapterPriority.get(a.adapterId) ?? 999;
      const bP = adapterPriority.get(b.adapterId) ?? 999;
      return aP - bP;
    });
    primary.push(measurements[0]);

    if (measurements.length >= 2) {
      const indicatorId = measurements[0].indicatorId;
      const countryCode = measurements[0].countryCode;
      const values = measurements.map(m => m.rawValue);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const divPercent = mean !== 0 ? Math.abs((max - min) / mean) * 100 : 0;
      const threshold = DIVERGENCE_THRESHOLDS[indicatorId] ?? DEFAULT_THRESHOLD;

      let status: CrossSourceDivergence['status'] = 'ok';
      if (divPercent > threshold * 2) status = 'critical';
      else if (divPercent > threshold) status = 'warning';

      divergences.push({
        countryCode,
        indicatorId,
        observations: measurements.map(m => ({
          adapterId: m.adapterId,
          rawValue: m.rawValue,
          referenceDate: m.referenceDate,
        })),
        divergencePercent: Math.round(divPercent * 10) / 10,
        status,
        thresholdPercent: threshold,
      });
    }
  });

  return {
    measurements: primary,
    allMeasurements,
    health: adapterRuns.map(r => r.result.health),
    divergences,
    unroutedIndicators: Array.from(unrouted),
  };
}
