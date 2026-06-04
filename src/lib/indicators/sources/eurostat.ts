/**
 * Eurostat Adapter — EU + candidate country fresh data
 *
 * Covers our 11 Eurostat-tracked countries (GB, DE, FR, ES, IT, NL, SE, NO,
 * PL, TR, CH) with more current data than the World Bank for:
 *   - unemployment_rate          (Eurostat: une_rt_a, total, age 15-74)
 *   - youth_unemployment_rate    (Eurostat: une_rt_a, age 15-24)
 *   - fertility_rate             (Eurostat: demo_find — total fertility rate)
 *
 * Why include: Eurostat publishes annually with shorter lag than the World
 * Bank. Both datasets stay registered → orchestrator picks Eurostat as
 * primary (higher priority), uses WB as cross-source for divergence
 * detection. Mismatch triggers a flag on /data-sources.
 *
 * Endpoint: https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/
 * Format: SDMX-JSON (complex but well-documented)
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  AdapterHealth,
} from '../types';

// Map ISO 3166-1 alpha-2 → Eurostat geo code (mostly identical)
const COUNTRY_CODES: Record<string, string> = {
  GB: 'UK', DE: 'DE', FR: 'FR', ES: 'ES', IT: 'IT',
  NL: 'NL', SE: 'SE', NO: 'NO', PL: 'PL', TR: 'TR', CH: 'CH',
};
const EUROSTAT_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODES).map(([k, v]) => [v, k])
);

const PROVIDED_INDICATORS = new Set([
  'unemployment_rate',
  'youth_unemployment_rate',
  'fertility_rate',
]);

// SDMX-JSON parsing helpers
interface SdmxResponse {
  dataSets: { observations: Record<string, [number]> }[];
  structure: {
    dimensions: { observation: { id: string; values: { id: string }[] }[] };
  };
}

function parseSdmx(json: SdmxResponse): Map<string, { value: number; year: number }> {
  // Returns Map<geoCode, {value, year}>
  const out = new Map<string, { value: number; year: number }>();
  const ds = json.dataSets?.[0];
  if (!ds?.observations) return out;

  const dims = json.structure?.dimensions?.observation;
  if (!dims) return out;

  // Find geo and time dimension indices
  const geoIdx = dims.findIndex(d => d.id === 'geo' || d.id === 'GEO');
  const timeIdx = dims.findIndex(d => d.id === 'time' || d.id === 'TIME_PERIOD');
  if (geoIdx === -1 || timeIdx === -1) return out;

  const geoValues = dims[geoIdx].values;
  const timeValues = dims[timeIdx].values;

  // observations is keyed by dimension-index combinations like "0:0:0:0:5:2"
  Object.entries(ds.observations).forEach(([key, [val]]) => {
    if (val === null || val === undefined) return;
    const parts = key.split(':').map(p => parseInt(p, 10));
    const geoCode = geoValues[parts[geoIdx]]?.id;
    const yearStr = timeValues[parts[timeIdx]]?.id;
    if (!geoCode || !yearStr) return;
    const year = parseInt(yearStr, 10);
    if (!Number.isInteger(year)) return;

    const existing = out.get(geoCode);
    if (!existing || year > existing.year) {
      out.set(geoCode, { value: val, year });
    }
  });

  return out;
}

async function fetchEurostatDataset(
  dataset: string,
  filters: string,
  timeoutMs: number
): Promise<Map<string, { value: number; year: number }>> {
  const url = `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/${dataset}?${filters}&format=SDMX-JSON&lang=EN`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheHumanIndex/2.0', Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[eurostat] ${dataset}: HTTP ${res.status}`);
      return new Map();
    }
    const json = (await res.json()) as SdmxResponse;
    return parseSdmx(json);
  } finally {
    clearTimeout(t);
  }
}

export const eurostatAdapter: IndicatorAdapter = {
  id: 'eurostat',
  name: 'Eurostat',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 25_000 }) {
    const startedAt = Date.now();
    const requested = indicatorIds.filter(id => PROVIDED_INDICATORS.has(id));
    const eligibleCountries = countries.filter(c => COUNTRY_CODES[c.code]);
    const geoList = eligibleCountries.map(c => COUNTRY_CODES[c.code]).join('+');

    if (requested.length === 0 || eligibleCountries.length === 0) {
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

    // Each indicator has its own Eurostat dataset and filter pattern
    const dispatches: { indicatorId: string; dataset: string; filters: string }[] = [];

    if (requested.includes('unemployment_rate')) {
      // une_rt_a: annual unemployment rate. Filter: sex=T (total), age=Y15-74,
      // unit=PC_ACT (percent of active population), geo=our list
      dispatches.push({
        indicatorId: 'unemployment_rate',
        dataset: 'une_rt_a',
        filters: `sex=T&age=Y15-74&unit=PC_ACT&geo=${geoList}`,
      });
    }
    if (requested.includes('youth_unemployment_rate')) {
      dispatches.push({
        indicatorId: 'youth_unemployment_rate',
        dataset: 'une_rt_a',
        filters: `sex=T&age=Y15-24&unit=PC_ACT&geo=${geoList}`,
      });
    }
    if (requested.includes('fertility_rate')) {
      // demo_find: total fertility rate (births per woman)
      dispatches.push({
        indicatorId: 'fertility_rate',
        dataset: 'demo_find',
        filters: `indic_de=TOTFERRT&geo=${geoList}`,
      });
    }

    const results = await Promise.allSettled(
      dispatches.map(d =>
        fetchEurostatDataset(d.dataset, d.filters, timeoutMs).then(m => ({ indicatorId: d.indicatorId, byCountry: m }))
      )
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        lastError = String(r.reason);
        console.warn('[eurostat] dispatch rejected:', lastError);
        continue;
      }
      const { indicatorId, byCountry } = r.value;
      byCountry.forEach(({ value, year }, geoCode) => {
        const iso2 = EUROSTAT_TO_ISO2[geoCode];
        if (!iso2) return;
        countriesReturned.add(iso2);
        measurements.push({
          countryCode: iso2,
          indicatorId,
          rawValue: value,
          referenceDate: `${year}-12-31`,
          payload: { source: 'Eurostat', geo: geoCode, year },
        });
      });
    }

    const status: AdapterHealth['status'] =
      measurements.length === 0 ? 'failed' :
      countriesReturned.size < eligibleCountries.length / 2 ? 'degraded' :
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
