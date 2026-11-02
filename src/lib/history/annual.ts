/**
 * Historical structural index (HSI) — annual backfill, 2000 → last full year.
 *
 * Built ONLY from indicators that have genuine annual histories at a single
 * source (World Bank Open Data). Static-seed indicators (Gallup, WVS, OECD
 * Better Life, DataReportal, McKinsey…) have no history, so they are left
 * out rather than held constant — holding them constant would fabricate a
 * history that never existed. Consequences, stated on the site:
 *   - HSI ≠ the live composite; it is a separate, labelled series.
 *   - The technological meta-index has no World Bank inputs → absent.
 *
 * For each year Y and (country, indicator): the latest observation dated in
 * a year ≤ Y is used, and the normal stale-data policy is evaluated at the
 * end of year Y (≤3y full weight, 3–5y half, >5y excluded). Normalisation
 * bounds, within-meta weights and meta weights are the live registry's.
 */

import { composeCountryScores, DEFAULT_META_WEIGHTS } from '../indicators/composeMetaIndex';
import type { NormalizedMeasurement } from '../indicators/orchestrator';
import { normalizeIndicator, type IndicatorRegistryRow, type MetaIndex } from '../indicators/types';
import { fetchOneChunk, INDICATOR_TO_WB_CODE, WB_ISO2_TO_ISO3, WB_ISO3_TO_ISO2 } from '../indicators/sources/worldBank';

export const HSI_METHOD_VERSION = 'hsi-1';
export const HSI_START_YEAR = 2000;

export interface HistoricalObservation {
  countryCode: string;
  indicatorId: string;
  year: number;
  rawValue: number;
  normalizedValue: number | null;
}

export interface HistoricalScore {
  countryCode: string;
  year: number;
  composite: number | null;
  meta: Partial<Record<MetaIndex, { value: number | null; with_data: number; total: number }>>;
  indicatorsUsed: number;
  indicatorsTotal: number;
}

/** Indicators eligible for the historical series: active + served by World Bank. */
export function historicalIndicators(registry: IndicatorRegistryRow[]): IndicatorRegistryRow[] {
  return registry.filter(i => i.active && INDICATOR_TO_WB_CODE[i.id]);
}

export async function fetchWorldBankHistory(
  indicators: IndicatorRegistryRow[],
  countryCodes: string[],
  startYear: number,
  endYear: number,
): Promise<{ observations: HistoricalObservation[]; errors: string[] }> {
  const iso3 = countryCodes.map(c => WB_ISO2_TO_ISO3[c]).filter(Boolean);
  const chunks: string[][] = [];
  for (let i = 0; i < iso3.length; i += 5) chunks.push(iso3.slice(i, i + 5));

  const errors: string[] = [];
  const observations: HistoricalObservation[] = [];
  const jobs = indicators.flatMap(ind => chunks.map(chunk => ({ ind, chunk })));

  // Bounded concurrency — World Bank throttles bursts.
  const CONCURRENCY = 8;
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const { ind, chunk } = jobs[next++];
      try {
        const rows = await fetchOneChunk(INDICATOR_TO_WB_CODE[ind.id], chunk, startYear, endYear);
        for (const r of rows) {
          const cc = WB_ISO3_TO_ISO2[r.countryiso3code];
          const year = parseInt(r.date, 10);
          if (!cc || r.value === null || !Number.isFinite(r.value) || !Number.isFinite(year)) continue;
          observations.push({
            countryCode: cc,
            indicatorId: ind.id,
            year,
            rawValue: r.value,
            normalizedValue: normalizeIndicator(r.value, ind),
          });
        }
      } catch (e) {
        errors.push(`${ind.id} [${chunk.join(';')}]: ${(e as Error).message}`);
      }
    }
  }));
  return { observations, errors };
}

export function composeHistory(
  observations: HistoricalObservation[],
  indicators: IndicatorRegistryRow[],
  countryCodes: string[],
  startYear: number,
  endYear: number,
): HistoricalScore[] {
  // (country|indicator) → observations sorted by year
  const series = new Map<string, HistoricalObservation[]>();
  for (const o of observations) {
    const k = `${o.countryCode}|${o.indicatorId}`;
    if (!series.has(k)) series.set(k, []);
    series.get(k)!.push(o);
  }
  for (const s of series.values()) s.sort((a, b) => a.year - b.year);

  const out: HistoricalScore[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const measurements: NormalizedMeasurement[] = [];
    for (const cc of countryCodes) {
      for (const ind of indicators) {
        const s = series.get(`${cc}|${ind.id}`);
        if (!s) continue;
        let best: HistoricalObservation | null = null;
        for (const o of s) if (o.year <= year) best = o; else break;
        if (!best || best.normalizedValue === null) continue;
        measurements.push({
          countryCode: cc,
          indicatorId: ind.id,
          rawValue: best.rawValue,
          referenceDate: `${best.year}-12-31`,
          normalizedValue: best.normalizedValue,
          adapterId: 'worldBank',
        });
      }
    }
    const evalAt = Date.UTC(year, 11, 31, 12);
    const comps = composeCountryScores(measurements, indicators, countryCodes, DEFAULT_META_WEIGHTS, evalAt);
    for (const c of comps) {
      out.push({
        countryCode: c.countryCode,
        year,
        composite: c.compositeValue,
        meta: Object.fromEntries(c.metaIndexes.map(m => [m.metaIndex, { value: m.value, with_data: m.indicatorsWithData, total: m.indicatorsCount }])),
        indicatorsUsed: c.metaIndexes.reduce((a, m) => a + m.indicatorsWithData, 0),
        indicatorsTotal: indicators.length,
      });
    }
  }
  return out;
}
