/**
 * IMF Data Mapper Adapter — global economic indicators
 *
 * Free, no-auth JSON API covering 200+ countries with annual values for
 * macroeconomic series. Powers:
 *
 *   - unemployment_rate          (IMF LUR, cross-source with WB + Eurostat)
 *   - inflation_rate             (IMF PCPIPCH, primary — new in migration 012)
 *
 * Endpoint pattern:
 *   https://www.imf.org/external/datamapper/api/v1/<SERIES>?periods=2023,2024,2025
 *
 * Response shape (excerpt):
 *   {
 *     "values": {
 *       "LUR": {
 *         "USA": { "2023": 3.6, "2024": 4.0, "2025": null },
 *         "DEU": { "2023": 3.0, "2024": 3.4, "2025": 3.7 }
 *       }
 *     }
 *   }
 *
 * The API uses ISO-3 country codes (USA, DEU, TUR). We map from our ISO-2.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  AdapterHealth,
} from '../types';

const ISO2_TO_ISO3: Record<string, string> = {
  US: 'USA', CA: 'CAN', MX: 'MEX',
  GB: 'GBR', DE: 'DEU', FR: 'FRA', ES: 'ESP', IT: 'ITA',
  NL: 'NLD', SE: 'SWE', NO: 'NOR', PL: 'POL', TR: 'TUR', CH: 'CHE',
  JP: 'JPN', KR: 'KOR', IN: 'IND', SG: 'SGP',
  AU: 'AUS', NZ: 'NZL',
  BR: 'BRA', AR: 'ARG',
  ZA: 'ZAF',
  IL: 'ISR', AE: 'ARE',
};
const ISO3_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_ISO3).map(([k, v]) => [v, k])
);

const INDICATOR_TO_IMF_SERIES: Record<string, string> = {
  unemployment_rate: 'LUR',           // Unemployment rate, %
  inflation_rate: 'PCPIPCH',          // Inflation, average consumer prices, % change
};

const PROVIDED_INDICATORS = new Set(Object.keys(INDICATOR_TO_IMF_SERIES));

interface ImfResponse {
  values?: Record<string, Record<string, Record<string, number | null>>>;
}

async function fetchOneSeries(
  series: string,
  iso3Codes: string[],
  timeoutMs: number
): Promise<Map<string, { value: number; year: number }>> {
  // IMF API ignores ?periods=… query and the documented filter syntax has
  // moved. Fetch the full series and filter client-side. The payload is
  // ~150-300KB for a single series across 200+ countries × 50+ years; trivial.
  const url = `https://www.imf.org/external/datamapper/api/v1/${series}`;
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 5;  // accept any reasonably recent value

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheHumanIndex/2.0', Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[imf] ${series}: HTTP ${res.status}`);
      return new Map();
    }
    const json = (await res.json()) as ImfResponse;
    const seriesData = json.values?.[series];
    if (!seriesData) return new Map();

    const out = new Map<string, { value: number; year: number }>();
    const requested = new Set(iso3Codes);

    for (const [iso3, yearMap] of Object.entries(seriesData)) {
      if (!requested.has(iso3)) continue;
      let latestYear = 0;
      let latestValue: number | null = null;
      for (const [yearStr, val] of Object.entries(yearMap)) {
        if (val === null || val === undefined) continue;
        const year = parseInt(yearStr, 10);
        if (!Number.isInteger(year)) continue;
        if (year < minYear) continue;       // skip historical noise
        if (year > latestYear) {
          latestYear = year;
          latestValue = Number(val);
        }
      }
      if (latestValue !== null) {
        out.set(iso3, { value: latestValue, year: latestYear });
      }
    }
    return out;
  } finally {
    clearTimeout(t);
  }
}

export const imfAdapter: IndicatorAdapter = {
  id: 'imf',
  name: 'IMF Data Mapper',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 25_000 }) {
    const startedAt = Date.now();
    const requested = indicatorIds.filter(id => PROVIDED_INDICATORS.has(id));
    const iso3 = countries
      .map(c => ISO2_TO_ISO3[c.code])
      .filter((x): x is string => Boolean(x));

    if (requested.length === 0 || iso3.length === 0) {
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
    const countriesReturned = new Set<string>();
    let lastError: string | null = null;

    const results = await Promise.allSettled(
      requested.map(indicatorId => {
        const series = INDICATOR_TO_IMF_SERIES[indicatorId];
        return fetchOneSeries(series, iso3, timeoutMs).then(m => ({ indicatorId, byCountry: m }));
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        lastError = String(r.reason);
        console.warn('[imf] series fetch rejected:', lastError);
        continue;
      }
      const { indicatorId, byCountry } = r.value;
      byCountry.forEach(({ value, year }, iso3code) => {
        const iso2 = ISO3_TO_ISO2[iso3code];
        if (!iso2) return;
        countriesReturned.add(iso2);
        measurements.push({
          countryCode: iso2,
          indicatorId,
          rawValue: value,
          referenceDate: `${year}-12-31`,
          payload: { source: 'IMF', series: INDICATOR_TO_IMF_SERIES[indicatorId], year },
        });
      });
    }

    const status: AdapterHealth['status'] =
      measurements.length === 0 ? 'failed' :
      countriesReturned.size < countries.length / 2 ? 'degraded' :
      'ok';

    return {
      measurements,
      health: {
        adapter: this.id,
        status,
        countriesRequested: countries.length,
        countriesReturned: countriesReturned.size,
        indicatorsRequested: requested.length,
        measurementsReturned: measurements.length,
        durationMs: Date.now() - startedAt,
        error: lastError,
      },
    };
  },
};
