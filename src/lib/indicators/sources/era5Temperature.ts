/**
 * Temperature anomaly from ERA5 (World Bank Climate Change Knowledge Portal),
 * read from data/live/era5-temperature.json (refreshed by GitHub Actions).
 *
 * temperature_anomaly = annual country-mean temperature of the latest
 * completed year − its 1951–1980 mean, matching the catalog definition
 * ("annual mean temperature deviation from the 1951-1980 baseline").
 * Replaces the hand-entered Berkeley Earth 2024 seed (kept as fallback).
 */

import type { IndicatorAdapter, IndicatorMeasurement } from '../types';
import snapshot from '../../../../data/live/era5-temperature.json';

const ISO2_TO_ISO3: Record<string, string> = {
  US: 'USA', CA: 'CAN', MX: 'MEX', GB: 'GBR', DE: 'DEU', FR: 'FRA', ES: 'ESP', IT: 'ITA',
  NL: 'NLD', SE: 'SWE', NO: 'NOR', PL: 'POL', TR: 'TUR', CH: 'CHE', JP: 'JPN', KR: 'KOR',
  IN: 'IND', SG: 'SGP', AU: 'AUS', NZ: 'NZL', BR: 'BRA', AR: 'ARG', ZA: 'ZAF', IL: 'ISR', AE: 'ARE',
};
const PROVIDED = new Set(['temperature_anomaly']);
const BASE_FROM = 1951, BASE_TO = 1980;

/** Exported for tests. */
export function anomalyLatest(points: [number, number][] | undefined, maxYear: number): { year: number; anomaly: number; baseline: number } | null {
  if (!points?.length) return null;
  const base = points.filter(([y]) => y >= BASE_FROM && y <= BASE_TO).map(([, v]) => v);
  if (base.length < 25) return null;
  const baseline = base.reduce((a, b) => a + b, 0) / base.length;
  const latest = points.filter(([y]) => y <= maxYear).sort((a, b) => b[0] - a[0])[0];
  if (!latest) return null;
  return { year: latest[0], anomaly: Math.round((latest[1] - baseline) * 100) / 100, baseline: Math.round(baseline * 100) / 100 };
}

export const era5TemperatureAdapter: IndicatorAdapter = {
  id: 'era5Cckp',
  name: 'ERA5 via World Bank CCKP',
  providedIndicators: PROVIDED,

  async fetchValues({ countries, indicatorIds }) {
    const started = Date.now();
    const measurements: IndicatorMeasurement[] = [];
    if (indicatorIds.includes('temperature_anomaly')) {
      const snap = snapshot as unknown as { collection: string; countries: Record<string, [number, number][]> };
      const maxYear = new Date().getUTCFullYear() - 1;
      for (const c of countries) {
        const r = anomalyLatest(snap.countries[ISO2_TO_ISO3[c.code] ?? ''], maxYear);
        if (!r) continue;
        measurements.push({
          countryCode: c.code,
          indicatorId: 'temperature_anomaly',
          rawValue: r.anomaly,
          referenceDate: `${r.year}-12-31`,
          payload: { source: 'ERA5 (World Bank CCKP)', collection: snap.collection, baseline_1951_1980_c: r.baseline },
        });
      }
    }
    return {
      measurements,
      health: {
        adapter: this.id,
        status: measurements.length ? 'ok' : 'failed',
        countriesRequested: countries.length,
        countriesReturned: measurements.length,
        indicatorsRequested: indicatorIds.filter(i => PROVIDED.has(i)).length,
        measurementsReturned: measurements.length,
        durationMs: Date.now() - started,
        error: measurements.length ? null : 'empty snapshot (data/live/era5-temperature.json)',
      },
    };
  },
};
