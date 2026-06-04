/**
 * WHO Global Health Observatory (GHO) OData Adapter
 *
 * WHO publishes country-level health indicators through an OData JSON API.
 * Endpoint pattern: https://ghoapi.azureedge.net/api/<INDICATOR_CODE>
 *
 * Response shape:
 *   {
 *     "@odata.context": "...",
 *     "value": [
 *       { "Id": 123, "IndicatorCode": "MH_25", "SpatialDimType": "COUNTRY",
 *         "SpatialDim": "TUR", "TimeDim": 2019, "Dim1": "SEX_BTSX",
 *         "NumericValue": 4.65, "Low": ..., "High": ..., ... },
 *       ...
 *     ]
 *   }
 *
 * Indicators we map:
 *   - depression_prevalence ← MH_25 (Prevalence of depressive disorders)
 *   - anxiety_prevalence    ← MH_26 (Prevalence of anxiety disorders)
 *
 * Note: WHO's mental health prevalence indicators are derived from IHME GBD.
 * We filter to Dim1 = SEX_BTSX (both sexes) and pick the most recent year.
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  CountryRow,
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

const INDICATOR_TO_WHO_CODE: Record<string, string> = {
  depression_prevalence: 'MH_25',
  anxiety_prevalence: 'MH_26',
};

const PROVIDED_INDICATORS = new Set(Object.keys(INDICATOR_TO_WHO_CODE));

interface WhoObservation {
  IndicatorCode: string;
  SpatialDimType: string;
  SpatialDim: string;
  TimeDim: number | string;
  Dim1?: string;
  NumericValue: number | null;
}

async function fetchOneWhoIndicator(
  whoCode: string,
  timeoutMs: number
): Promise<WhoObservation[]> {
  const url = `https://ghoapi.azureedge.net/api/${whoCode}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TheHumanIndex/2.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[who] ${whoCode}: HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (!json || !Array.isArray(json.value)) return [];
    return json.value as WhoObservation[];
  } finally {
    clearTimeout(t);
  }
}

export const whoGhoAdapter: IndicatorAdapter = {
  id: 'whoGho',
  name: 'WHO Global Health Observatory',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 30_000 }) {
    const startedAt = Date.now();
    const requested = indicatorIds.filter(id => PROVIDED_INDICATORS.has(id));
    const wantedIso3 = new Set(
      countries.map(c => ISO2_TO_ISO3[c.code]).filter((x): x is string => Boolean(x))
    );

    const measurements: IndicatorMeasurement[] = [];
    const countriesReturned = new Set<string>();
    let lastError: string | null = null;

    const results = await Promise.allSettled(
      requested.map(indicatorId => {
        const whoCode = INDICATOR_TO_WHO_CODE[indicatorId];
        return fetchOneWhoIndicator(whoCode, timeoutMs).then(obs => ({ indicatorId, obs }));
      })
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        lastError = String(r.reason);
        console.warn('[who] indicator fetch rejected:', lastError);
        continue;
      }
      const { indicatorId, obs } = r.value;

      // Group by country, prefer SEX_BTSX (both sexes), pick latest year
      const byCountry = new Map<string, WhoObservation>();
      for (const o of obs) {
        if (o.SpatialDimType !== 'COUNTRY') continue;
        if (!wantedIso3.has(o.SpatialDim)) continue;
        if (o.NumericValue === null || o.NumericValue === undefined) continue;
        if (o.Dim1 && o.Dim1 !== 'SEX_BTSX' && o.Dim1 !== 'TOTL') continue;

        const existing = byCountry.get(o.SpatialDim);
        const oYear = typeof o.TimeDim === 'string' ? parseInt(o.TimeDim, 10) : o.TimeDim;
        const eYear = existing ? (typeof existing.TimeDim === 'string' ? parseInt(existing.TimeDim, 10) : existing.TimeDim) : 0;
        if (!existing || oYear > eYear) {
          byCountry.set(o.SpatialDim, o);
        }
      }

      byCountry.forEach((o, iso3code) => {
        const iso2code = ISO3_TO_ISO2[iso3code];
        if (!iso2code) return;
        countriesReturned.add(iso2code);
        const year = typeof o.TimeDim === 'string' ? parseInt(o.TimeDim, 10) : o.TimeDim;
        measurements.push({
          countryCode: iso2code,
          indicatorId,
          rawValue: Number(o.NumericValue),
          referenceDate: `${year}-12-31`,
          payload: { who_code: INDICATOR_TO_WHO_CODE[indicatorId], source_year: year },
        });
      });
    }

    const status: AdapterHealth['status'] =
      measurements.length === 0 ? 'failed' :
      countriesReturned.size < countries.length / 2 ? 'degraded' :
      'ok';

    const health: AdapterHealth = {
      adapter: this.id,
      status,
      countriesRequested: countries.length,
      countriesReturned: countriesReturned.size,
      indicatorsRequested: requested.length,
      measurementsReturned: measurements.length,
      durationMs: Date.now() - startedAt,
      error: lastError,
    };

    return { measurements, health };
  },
};
