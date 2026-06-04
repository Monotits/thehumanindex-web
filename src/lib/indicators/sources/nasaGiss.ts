/**
 * NASA GISS GISTEMP Adapter — temperature_anomaly
 *
 * NASA's Goddard Institute publishes annual mean surface temperature anomaly
 * (vs the 1951-1980 baseline) as a CSV.
 *
 * Endpoint: https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
 *
 * The CSV has this shape (excerpt):
 *   Land-Ocean Temperature Index (C)
 *   ...
 *   Year   Jan  Feb  ...  Dec  J-D  D-N  DJF  MAM  JJA  SON
 *   1880  -.18 -.25 ...  -.18  -.17 ***  ...
 *   ...
 *   2025   1.45 1.52 ...  1.41  1.46 ...
 *
 * We extract the "J-D" annual mean column for the latest year with a numeric
 * value. This is a single global figure — for v1 we apply it to all 25
 * countries as a proxy. (v2 will switch to per-country Berkeley Earth or
 * World Bank CCKP for true country-level anomalies.)
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  CountryRow,
  AdapterHealth,
} from '../types';

const GISS_URL = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv';
const PROVIDED_INDICATORS = new Set(['temperature_anomaly']);

function parseLatestAnnualAnomaly(csv: string): { year: number; value: number } | null {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  let headerIdx = -1;
  let jdColIdx = -1;

  // Find header row that contains both "Year" and "J-D"
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const parts = lines[i].split(/\s+/);
    if (parts[0] === 'Year' && parts.includes('J-D')) {
      headerIdx = i;
      jdColIdx = parts.indexOf('J-D');
      break;
    }
  }
  if (headerIdx === -1) return null;

  let latestYear = 0;
  let latestValue: number | null = null;

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // Skip section headers / footers
    if (!/^\d{4}/.test(line)) continue;
    const parts = line.split(/\s+/);
    const year = parseInt(parts[0], 10);
    if (!Number.isInteger(year)) continue;
    const raw = parts[jdColIdx];
    if (!raw || raw === '***' || raw === '*') continue;
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) continue;
    if (year > latestYear) {
      latestYear = year;
      latestValue = value;
    }
  }
  return latestValue !== null ? { year: latestYear, value: latestValue } : null;
}

export const nasaGissAdapter: IndicatorAdapter = {
  id: 'nasaGiss',
  name: 'NASA GISS GISTEMP',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 20_000 }) {
    const startedAt = Date.now();
    const wantTemp = indicatorIds.includes('temperature_anomaly');
    if (!wantTemp || countries.length === 0) {
      return {
        measurements: [],
        health: {
          adapter: this.id,
          status: 'ok',
          countriesRequested: countries.length,
          countriesReturned: 0,
          indicatorsRequested: 0,
          measurementsReturned: 0,
          durationMs: Date.now() - startedAt,
          error: null,
        },
      };
    }

    const measurements: IndicatorMeasurement[] = [];
    let error: string | null = null;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(GISS_URL, {
        headers: { 'User-Agent': 'TheHumanIndex/2.0' },
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!res.ok) {
        error = `HTTP ${res.status}`;
      } else {
        const csv = await res.text();
        const latest = parseLatestAnnualAnomaly(csv);
        if (!latest) {
          error = 'Could not parse annual anomaly from CSV';
        } else {
          // Apply the global anomaly to all 25 countries as a proxy
          for (const c of countries) {
            measurements.push({
              countryCode: c.code,
              indicatorId: 'temperature_anomaly',
              rawValue: latest.value,
              referenceDate: `${latest.year}-12-31`,
              payload: { source: 'NASA GISS GLB', proxy: 'global_mean_for_all_countries', year: latest.year },
            });
          }
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      clearTimeout(t);
    }

    const status: AdapterHealth['status'] =
      measurements.length === 0 ? 'failed' : 'ok';

    const health: AdapterHealth = {
      adapter: this.id,
      status,
      countriesRequested: countries.length,
      countriesReturned: measurements.length,
      indicatorsRequested: 1,
      measurementsReturned: measurements.length,
      durationMs: Date.now() - startedAt,
      error,
    };

    return { measurements, health };
  },
};
