/**
 * Eurostat Adapter — EU + candidate country fresh data (JSON-stat 2.0)
 *
 * Covers our 11 Eurostat-tracked countries (GB, DE, FR, ES, IT, NL, SE, NO,
 * PL, TR, CH) with more current data than the World Bank for:
 *   - unemployment_rate          (Eurostat: une_rt_a, total, age 15-74)
 *   - youth_unemployment_rate    (Eurostat: une_rt_a, age 15-24)
 *   - fertility_rate             (Eurostat: demo_find — TOTFERRT)
 *
 * Eurostat deprecated the old SDMX-JSON API in 2024 in favor of the new
 * REST API returning JSON-stat 2.0 format.
 *
 * Endpoint base: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/<DATASET>
 * Format param:  format=JSON
 *
 * JSON-stat 2.0 structure (relevant slice):
 *   {
 *     value: [12.3, 11.5, …],       // flat array, length = prod(size)
 *     id: ["freq","sex","age","unit","geo","time"],
 *     size: [1, 1, 1, 1, 5, 10],
 *     dimension: {
 *       geo: { category: { index: { DE: 0, FR: 1, … } } },
 *       time: { category: { index: { "2020": 0, "2021": 1, … } } },
 *       …
 *     }
 *   }
 *
 * The flat value array is indexed in C-order (row-major) by the dimension
 * sizes. The index of (dim0=a, dim1=b, …, dimN=z) is
 *    a*prod(size[1..]) + b*prod(size[2..]) + … + z
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  AdapterHealth,
} from '../types';

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
  'gini_index',
]);

interface JsonStat {
  value: Record<string, number> | (number | null)[];
  id: string[];
  size: number[];
  dimension: Record<string, {
    category: { index: Record<string, number> | string[] };
  }>;
}

/** Normalize index — Eurostat returns either { key: idx } or array of keys */
function getDimIndex(dim: JsonStat['dimension'][string]): Record<string, number> {
  const idx = dim.category.index;
  if (Array.isArray(idx)) {
    const out: Record<string, number> = {};
    idx.forEach((k, i) => { out[k] = i; });
    return out;
  }
  return idx;
}

function parseJsonStat(
  json: JsonStat
): Map<string, { value: number; year: number }> {
  const out = new Map<string, { value: number; year: number }>();
  if (!json?.value || !json.id || !json.size || !json.dimension) return out;

  const geoIdx = json.id.findIndex(d => d.toLowerCase() === 'geo');
  const timeIdx = json.id.findIndex(d => d.toLowerCase() === 'time' || d.toLowerCase() === 'time_period');
  if (geoIdx === -1 || timeIdx === -1) return out;

  const geoMap = getDimIndex(json.dimension[json.id[geoIdx]]);
  const timeMap = getDimIndex(json.dimension[json.id[timeIdx]]);

  // Reverse lookups (position → key)
  const geoKeys: string[] = [];
  Object.entries(geoMap).forEach(([k, v]) => { geoKeys[v] = k; });
  const timeKeys: string[] = [];
  Object.entries(timeMap).forEach(([k, v]) => { timeKeys[v] = k; });

  // Strides for flat index calculation (C-order: last dim varies fastest)
  const sizes = json.size;
  const strides = sizes.map((_, i) => sizes.slice(i + 1).reduce((a, b) => a * b, 1));

  const isObjectValues = !Array.isArray(json.value);
  const getValueAt = (flatIdx: number): number | null => {
    if (isObjectValues) {
      const v = (json.value as Record<string, number>)[String(flatIdx)];
      return v === undefined ? null : v;
    }
    return (json.value as (number | null)[])[flatIdx];
  };

  // We only care about geo × time combos; for any other dimensions Eurostat
  // returns size=1 when filters are applied. Loop with all dimensions at 0
  // except geo and time.
  const baseCoords = sizes.map(() => 0);
  for (let g = 0; g < (sizes[geoIdx] ?? 0); g++) {
    for (let t = 0; t < (sizes[timeIdx] ?? 0); t++) {
      baseCoords[geoIdx] = g;
      baseCoords[timeIdx] = t;
      const flat = baseCoords.reduce((acc, c, i) => acc + c * strides[i], 0);
      const v = getValueAt(flat);
      if (v === null || v === undefined) continue;
      const geoCode = geoKeys[g];
      const year = parseInt(timeKeys[t], 10);
      if (!geoCode || !Number.isInteger(year)) continue;

      const existing = out.get(geoCode);
      if (!existing || year > existing.year) {
        out.set(geoCode, { value: v, year });
      }
    }
  }
  return out;
}

async function fetchEurostatDataset(
  dataset: string,
  filters: Record<string, string | string[]>,
  timeoutMs: number
): Promise<Map<string, { value: number; year: number }>> {
  const params = new URLSearchParams();
  params.set('format', 'JSON');
  params.set('lang', 'EN');
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v)) v.forEach(x => params.append(k, x));
    else params.append(k, v);
  }
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?${params.toString()}`;

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
    const json = (await res.json()) as JsonStat;
    return parseJsonStat(json);
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
    const geoList = eligibleCountries.map(c => COUNTRY_CODES[c.code]);

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

    const currentYear = new Date().getFullYear();
    const sinceYear = currentYear - 5;

    const dispatches: { indicatorId: string; dataset: string; filters: Record<string, string | string[]> }[] = [
      ...(requested.includes('unemployment_rate') ? [{
        indicatorId: 'unemployment_rate',
        dataset: 'une_rt_a',
        filters: { sex: 'T', age: 'Y15-74', unit: 'PC_ACT', geo: geoList, sinceTimePeriod: String(sinceYear) },
      }] : []),
      ...(requested.includes('youth_unemployment_rate') ? [{
        indicatorId: 'youth_unemployment_rate',
        dataset: 'une_rt_a',
        filters: { sex: 'T', age: 'Y15-24', unit: 'PC_ACT', geo: geoList, sinceTimePeriod: String(sinceYear) },
      }] : []),
      ...(requested.includes('fertility_rate') ? [{
        indicatorId: 'fertility_rate',
        dataset: 'demo_find',
        filters: { indic_de: 'TOTFERRT', geo: geoList, sinceTimePeriod: String(sinceYear) },
      }] : []),
      ...(requested.includes('gini_index') ? [{
        // Gini coefficient of equivalised disposable income (EU-SILC).
        // Eurostat scales 0-100 (no decimal), matches our normalize bounds 25-55.
        indicatorId: 'gini_index',
        dataset: 'ilc_di12',
        filters: { geo: geoList, sinceTimePeriod: String(sinceYear) },
      }] : []),
    ];

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
