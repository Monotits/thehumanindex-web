/**
 * World Bank Open Data Adapter
 *
 * Free, no auth, covers 200+ countries. Returns annual values per country.
 * One API call per (indicator × country list), each indicator handled in parallel.
 *
 * Endpoint pattern:
 *   https://api.worldbank.org/v2/country/<codes>/indicator/<code>?format=json&date=<YYYY:YYYY>&per_page=50
 *
 * The response shape:
 *   [ <metadata>, [ { date: 'YYYY', value: number|null, countryiso3code: 'USA' }, ... ] ]
 *
 * Note: World Bank uses 3-letter ISO codes (USA, DEU, TUR) — we map from ISO2.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  CountryRow,
  AdapterHealth,
} from '../types';

// ISO 3166-1 alpha-2 → alpha-3 mapping for our 25 active countries
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

// Indicator ID (our registry) → World Bank series code
const INDICATOR_TO_WB_CODE: Record<string, string> = {
  unemployment_rate: 'SL.UEM.TOTL.ZS',
  youth_unemployment_rate: 'SL.UEM.1524.ZS',
  gini_index: 'SI.POV.GINI',
  fertility_rate: 'SP.DYN.TFRT.IN',
  suicide_rate: 'SH.STA.SUIC.P5',
  // income_share_top_10: 'SI.DST.10TH.10',   // optional future
};

const PROVIDED_INDICATORS = new Set(Object.keys(INDICATOR_TO_WB_CODE));

interface WBObservation {
  date: string;
  value: number | null;
  countryiso3code: string;
}

async function fetchOneIndicator(
  wbCode: string,
  iso3Codes: string[],
  timeoutMs: number
): Promise<WBObservation[]> {
  // Fetch the most recent 5 years per country to maximize chance of finding a value
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 6;
  const codesParam = iso3Codes.join(';');
  const url = `https://api.worldbank.org/v2/country/${codesParam}/indicator/${wbCode}?format=json&date=${startYear}:${currentYear}&per_page=500`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheHumanIndex/2.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[worldbank] ${wbCode}: HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) return [];
    return json[1] as WBObservation[];
  } finally {
    clearTimeout(t);
  }
}

export const worldBankAdapter: IndicatorAdapter = {
  id: 'worldBank',
  name: 'World Bank Open Data',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 20_000 }) {
    const startedAt = Date.now();
    const requested = indicatorIds.filter(id => PROVIDED_INDICATORS.has(id));
    const iso3 = countries
      .map(c => ISO2_TO_ISO3[c.code])
      .filter((x): x is string => Boolean(x));

    const measurements: IndicatorMeasurement[] = [];
    let countriesReturnedSet = new Set<string>();
    let lastError: string | null = null;

    // Parallel fetch per indicator
    const results = await Promise.allSettled(
      requested.map(indicatorId => {
        const wbCode = INDICATOR_TO_WB_CODE[indicatorId];
        return fetchOneIndicator(wbCode, iso3, timeoutMs).then(obs => ({ indicatorId, obs }));
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        lastError = String(r.reason);
        console.warn('[worldbank] indicator fetch rejected:', lastError);
        continue;
      }
      const { indicatorId, obs } = r.value;

      // Group by country; pick the most recent non-null value
      const byCountry = new Map<string, WBObservation>();
      for (const o of obs) {
        if (o.value === null || o.value === undefined) continue;
        const existing = byCountry.get(o.countryiso3code);
        if (!existing || (existing.date < o.date)) {
          byCountry.set(o.countryiso3code, o);
        }
      }

      byCountry.forEach((o, iso3code) => {
        const iso2code = ISO3_TO_ISO2[iso3code];
        if (!iso2code) return;
        countriesReturnedSet.add(iso2code);
        measurements.push({
          countryCode: iso2code,
          indicatorId,
          rawValue: Number(o.value),
          referenceDate: `${o.date}-12-31`, // year-resolution; use end-of-year as reference
          payload: { source_year: o.date, wb_code: INDICATOR_TO_WB_CODE[indicatorId] },
        });
      });
    }

    const status: AdapterHealth['status'] =
      measurements.length === 0 ? 'failed' :
      countriesReturnedSet.size < countries.length / 2 ? 'degraded' :
      'ok';

    const health: AdapterHealth = {
      adapter: this.id,
      status,
      countriesRequested: countries.length,
      countriesReturned: countriesReturnedSet.size,
      indicatorsRequested: requested.length,
      measurementsReturned: measurements.length,
      durationMs: Date.now() - startedAt,
      error: lastError,
    };

    return { measurements, health };
  },
};
