/**
 * IMF World Economic Outlook — read from data/live/imf-weo.json.
 *
 * IMF's DataMapper answers HTTP 403 to Vercel's egress IPs (the reason the
 * old `imf` adapter was retired), so .github/workflows/oecd-snapshot.yml
 * fetches the series daily from GitHub Actions and commits the JSON.
 *
 * Provides:
 *   - gov_debt_pct_gdp  (GGXWDG_NGDP, general government gross debt, % GDP)
 *
 * WEO series run years into the future; only COMPLETED years count
 * (year ≤ current year − 1). The current year is itself an estimate.
 */

import type { IndicatorAdapter, IndicatorMeasurement } from '../types';
import snapshot from '../../../../data/live/imf-weo.json';

const ISO2_TO_ISO3: Record<string, string> = {
  US: 'USA', CA: 'CAN', MX: 'MEX', GB: 'GBR', DE: 'DEU', FR: 'FRA', ES: 'ESP', IT: 'ITA',
  NL: 'NLD', SE: 'SWE', NO: 'NOR', PL: 'POL', TR: 'TUR', CH: 'CHE', JP: 'JPN', KR: 'KOR',
  IN: 'IND', SG: 'SGP', AU: 'AUS', NZ: 'NZL', BR: 'BRA', AR: 'ARG', ZA: 'ZAF', IL: 'ISR', AE: 'ARE',
};

const INDICATOR_TO_SERIES: Record<string, string> = {
  gov_debt_pct_gdp: 'GGXWDG_NGDP',
};
const PROVIDED = new Set(Object.keys(INDICATOR_TO_SERIES));

type Snapshot = { series: Record<string, { countries: Record<string, [number, number][]> }> };

/** Latest completed-year value for one country/series. Exported for tests. */
export function latestCompleted(points: [number, number][] | undefined, maxYear: number): { year: number; value: number } | null {
  let best: { year: number; value: number } | null = null;
  for (const [y, v] of points ?? []) {
    if (typeof y !== 'number' || typeof v !== 'number' || y > maxYear) continue;
    if (!best || y > best.year) best = { year: y, value: v };
  }
  return best;
}

export const imfWeoAdapter: IndicatorAdapter = {
  id: 'imfWeo',
  name: 'IMF World Economic Outlook',
  providedIndicators: PROVIDED,

  async fetchValues({ countries, indicatorIds }) {
    const started = Date.now();
    const requested = indicatorIds.filter(id => PROVIDED.has(id));
    const maxYear = new Date().getUTCFullYear() - 1;
    const snap = snapshot as unknown as Snapshot;
    const measurements: IndicatorMeasurement[] = [];
    const returned = new Set<string>();

    for (const id of requested) {
      const block = snap.series[INDICATOR_TO_SERIES[id]];
      if (!block) continue;
      for (const c of countries) {
        const iso3 = ISO2_TO_ISO3[c.code];
        const best = iso3 ? latestCompleted(block.countries[iso3], maxYear) : null;
        if (!best) continue;
        measurements.push({
          countryCode: c.code,
          indicatorId: id,
          rawValue: best.value,
          referenceDate: `${best.year}-12-31`,
          payload: { series: INDICATOR_TO_SERIES[id], source: 'IMF WEO via DataMapper snapshot' },
        });
        returned.add(c.code);
      }
    }

    return {
      measurements,
      health: {
        adapter: this.id,
        status: measurements.length ? 'ok' : 'failed',
        countriesRequested: countries.length,
        countriesReturned: returned.size,
        indicatorsRequested: requested.length,
        measurementsReturned: measurements.length,
        durationMs: Date.now() - started,
        error: measurements.length ? null : 'empty snapshot (data/live/imf-weo.json)',
      },
    };
  },
};
