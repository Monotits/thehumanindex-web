/**
 * Indicator Orchestrator
 *
 * Brings together every indicator adapter, the registry, and the country list.
 * Used by the v2 cron path (/api/cron/refresh-v2 — to be added).
 *
 * Responsibilities:
 *   1. Read active indicators + countries from Supabase (or accept them as input)
 *   2. Route each indicator to the right adapter (worldBank, oecd, who, …)
 *   3. Call adapters in parallel
 *   4. Normalize raw values into 0-100 stress scores using indicator metadata
 *   5. Return measurements + per-adapter health for persistence
 *
 * Composition of meta-index and composite scores is a separate step (see
 * composeMetaIndex.ts) that operates on the normalized measurements.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  IndicatorRegistryRow,
  CountryRow,
  AdapterHealth,
  normalizeIndicator,
} from './types';
import { worldBankAdapter } from './sources/worldBank';

// Registry of all adapters. Add new sources here.
const ADAPTERS: IndicatorAdapter[] = [
  worldBankAdapter,
  // oecdAdapter,            // TODO
  // whoAdapter,             // TODO
  // nasaGissAdapter,        // TODO
  // wriAqueductAdapter,     // TODO
  // dataReportalAdapter,    // TODO
  // gallupAdapter,          // TODO (annual download, may be local-cache)
];

export interface NormalizedMeasurement extends IndicatorMeasurement {
  normalizedValue: number | null;  // 0-100; null when indicator metadata missing
}

export interface OrchestratorResult {
  measurements: NormalizedMeasurement[];
  health: AdapterHealth[];
  /** Indicators with no adapter routing them. Useful for surfacing gaps. */
  unroutedIndicators: string[];
}

/**
 * Fetch every active indicator for every active country and return normalized
 * measurements ready to be persisted to indicator_values.
 *
 * @param indicators registry rows (active only)
 * @param countries  registry rows (active only)
 * @param perAdapterTimeoutMs soft timeout passed to each adapter
 */
export async function fetchAllIndicatorValues(
  indicators: IndicatorRegistryRow[],
  countries: CountryRow[],
  perAdapterTimeoutMs = 20_000
): Promise<OrchestratorResult> {
  // Build indicator → adapter map
  const indicatorToAdapter = new Map<string, IndicatorAdapter>();
  const unrouted = new Set(indicators.map(i => i.id));

  for (const adapter of ADAPTERS) {
    adapter.providedIndicators.forEach(indicatorId => {
      if (!indicatorToAdapter.has(indicatorId)) {
        indicatorToAdapter.set(indicatorId, adapter);
        unrouted.delete(indicatorId);
      }
    });
  }

  // Group indicators by adapter
  const adapterToIndicators = new Map<IndicatorAdapter, string[]>();
  for (const indicator of indicators) {
    const adapter = indicatorToAdapter.get(indicator.id);
    if (!adapter) continue;
    if (!adapterToIndicators.has(adapter)) {
      adapterToIndicators.set(adapter, []);
    }
    adapterToIndicators.get(adapter)!.push(indicator.id);
  }

  // Run adapters in parallel
  const adapterRuns = await Promise.all(
    Array.from(adapterToIndicators.entries()).map(async ([adapter, indicatorIds]) => {
      try {
        return await adapter.fetchValues({
          countries,
          indicatorIds,
          timeoutMs: perAdapterTimeoutMs,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[orchestrator] adapter ${adapter.id} threw:`, message);
        return {
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
        };
      }
    })
  );

  // Index indicators by id for normalization lookups
  const indicatorById = new Map(indicators.map(i => [i.id, i]));

  // Aggregate + normalize
  const allMeasurements: NormalizedMeasurement[] = [];
  const allHealth: AdapterHealth[] = [];

  for (const run of adapterRuns) {
    allHealth.push(run.health);
    for (const m of run.measurements) {
      const meta = indicatorById.get(m.indicatorId);
      const normalized = meta ? normalizeIndicator(m.rawValue, meta) : null;
      allMeasurements.push({ ...m, normalizedValue: normalized });
    }
  }

  return {
    measurements: allMeasurements,
    health: allHealth,
    unroutedIndicators: Array.from(unrouted),
  };
}
