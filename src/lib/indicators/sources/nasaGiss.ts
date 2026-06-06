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

// AUDIT PHASE 5 FINDING: NASA GISS provides only a single GLOBAL mean
// anomaly. Applying it to all 25 countries as a proxy was misleading —
// e.g., TR composite environmental meta carried 0.012°C (a monthly slice
// near baseline) when reality is +1.5°C per Berkeley Earth.
//
// referenceSeed adapter now carries per-country Berkeley Earth 2024
// values for temperature_anomaly. This adapter no longer provides it.
// Kept as registered adapter (no-op) so we can re-enable if NASA exposes
// per-country anomalies in the future.
const PROVIDED_INDICATORS = new Set<string>();

/**
 * NASA GISS CSV format:
 *   - Comma-separated values
 *   - Header rows of metadata (skipped until we find the data header)
 *   - Data header: "Year,Jan,Feb,...,Dec,J-D,D-N,DJF,MAM,JJA,SON"
 *   - Data rows like: "2025,145,152,142,...,141,146,..."
 *   - Values are in 0.01°C (so 145 means +1.45°C anomaly vs 1951-1980 baseline)
 *   - Missing values shown as "***"
 */
function parseLatestAnnualAnomaly(csv: string): { year: number; value: number } | null {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  let jdColIdx = -1;
  let dataStartIdx = -1;

  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts[0] === 'Year' && parts.includes('J-D')) {
      jdColIdx = parts.indexOf('J-D');
      dataStartIdx = i + 1;
      break;
    }
  }
  if (jdColIdx === -1) return null;

  let latestYear = 0;
  let latestValue: number | null = null;

  for (let i = dataStartIdx; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    const year = parseInt(parts[0], 10);
    if (!Number.isInteger(year) || year < 1880 || year > 2100) continue;
    const raw = parts[jdColIdx];
    if (!raw || raw === '***' || raw === '*' || raw === '') continue;
    const num = parseFloat(raw);
    if (!Number.isFinite(num)) continue;
    // Values are in 0.01°C — convert to actual °C
    const valueC = num / 100;
    if (year > latestYear) {
      latestYear = year;
      latestValue = valueC;
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
