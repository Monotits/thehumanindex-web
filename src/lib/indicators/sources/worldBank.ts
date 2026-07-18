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
  inflation_rate: 'FP.CPI.TOTL.ZG',          // Consumer price inflation, annual %
  gdp_growth_rate: 'NY.GDP.MKTP.KD.ZG',      // Real GDP growth, annual %
  life_expectancy: 'SP.DYN.LE00.IN',         // Life expectancy at birth, years
  // gov_debt_pct_gdp: REMOVED — WB code GC.DOD.TOTL.GD.ZS missing for
  // 12/25 countries (JP, DE, IT, AR, etc.). Audit Phase 1 finding.
  // Now sourced from referenceSeed via IMF WEO October 2024.
  co2_per_capita: 'EN.GHG.CO2.PC.CE.AR5',    // CO2 emissions per capita (AR5), tonnes
  mortality_rate_under5: 'SH.DYN.MORT',      // Under-5 mortality per 1,000
  renewable_energy_pct: 'EG.FEC.RNEW.ZS',    // Renewable share of final energy, %
  alcohol_consumption_per_capita: 'SH.ALC.PCAP.LI', // Liters pure alcohol per capita 15+
  age_dependency_ratio: 'SP.POP.DPND',        // Dependents as % of working-age (15-64)
  adolescent_fertility_rate: 'SP.ADO.TFRT',   // Births per 1,000 women 15-19
  homicide_rate: 'VC.IHR.PSRC.P5',            // Intentional homicides per 100k
  // income_share_top_10: 'SI.DST.10TH.10',   // optional future
};

const PROVIDED_INDICATORS = new Set(Object.keys(INDICATOR_TO_WB_CODE));

interface WBObservation {
  date: string;
  value: number | null;
  countryiso3code: string;
}

const COUNTRY_CHUNK_SIZE = 5;
const PER_REQUEST_TIMEOUT_MS = 15_000; // each chunk request
const MAX_RETRIES = 1;

async function fetchOneChunk(
  wbCode: string,
  iso3Chunk: string[],
  startYear: number,
  endYear: number,
  attempt = 0
): Promise<WBObservation[]> {
  const codesParam = iso3Chunk.join(';');
  const url = `https://api.worldbank.org/v2/country/${codesParam}/indicator/${wbCode}?format=json&date=${startYear}:${endYear}&per_page=200`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheHumanIndex/2.0' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[worldbank] ${wbCode} [${codesParam}]: HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) return [];
    return json[1] as WBObservation[];
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    if (isAbort && attempt < MAX_RETRIES) {
      console.warn(`[worldbank] ${wbCode} [${codesParam}]: timeout, retrying (attempt ${attempt + 2})`);
      return fetchOneChunk(wbCode, iso3Chunk, startYear, endYear, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

async function fetchOneIndicator(
  wbCode: string,
  iso3Codes: string[],
  _timeoutMs: number
): Promise<WBObservation[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 6;

  // Chunk countries — World Bank API is slow for long pipe-separated lists.
  // Small batches in parallel are faster than one big request.
  const chunks: string[][] = [];
  for (let i = 0; i < iso3Codes.length; i += COUNTRY_CHUNK_SIZE) {
    chunks.push(iso3Codes.slice(i, i + COUNTRY_CHUNK_SIZE));
  }

  const results = await Promise.allSettled(
    chunks.map(chunk => fetchOneChunk(wbCode, chunk, startYear, currentYear))
  );

  const observations: WBObservation[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      observations.push(...r.value);
    } else {
      console.warn(`[worldbank] ${wbCode}: chunk failed —`, r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
  }
  return observations;
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
    const countriesReturnedSet = new Set<string>();
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
