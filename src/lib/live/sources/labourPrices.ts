/**
 * Monthly unemployment + inflation momentum.
 *
 * Sources (all free, no key):
 *   - OECD Infra-annual Labour Statistics, DF_IALFS_UNE_M (monthly unemployment, SA)
 *   - OECD Prices, DF_PRICES_ALL (CPI, YoY growth, national methodology)
 *     Both read from data/live/oecd-monthly.json, refreshed daily by GitHub
 *     Actions, because sdmx.oecd.org answers HTTP 500 to Vercel's IPs.
 *   - Eurostat une_rt_m (monthly unemployment, SA) — fallback where OECD is stale/missing
 *   - Eurostat prc_hicp_minr (HICP YoY, ECOICOP 2018 — replaced prc_hicp_manr in 2026)
 *     — primary inflation source for the European countries it covers.
 *
 * Momentum: 6-month change in the rate (pp), percentile vs the country's own
 * history since 2010. A rising unemployment rate / accelerating inflation =
 * higher stress.
 */

import type { LiveAdapter, LiveObservation, LiveSignalId } from '../types';
import { scoreMomentum, type Point } from '../scoring';
import { fetchJson, normalizePeriod, ISO3_TO_ISO2 } from '../http';
// Committed daily by .github/workflows/oecd-snapshot.yml — OECD blocks Vercel egress.
import oecdSnapshot from '../../../../data/live/oecd-monthly.json';

const START = '2010-01';
const LAG_MONTHS = 6;
const MIN_HISTORY = 60;      // 5 years of monthly momentum points
const MAX_AGE_DAYS = 150;    // period start → today; monthly releases lag ~1-2 months

const EUROSTAT_GEOS = ['FR', 'DE', 'IT', 'NL', 'ES', 'SE', 'PL', 'NO', 'CH', 'TR', 'US', 'JP'];

type SeriesBySource = Map<string, Point[]>; // countryCode → series

type OecdSnapshot = { series: Record<string, { dataflow: string; countries: Record<string, [string, number][]> }> };

function oecdFromSnapshot(key: 'unemployment' | 'cpi_yoy'): SeriesBySource {
  const out: SeriesBySource = new Map();
  const block = (oecdSnapshot as unknown as OecdSnapshot).series[key];
  if (!block) return out;
  for (const [iso3, pts] of Object.entries(block.countries)) {
    const cc = ISO3_TO_ISO2[iso3];
    if (!cc) continue;
    out.set(cc, pts.filter(([p, v]) => typeof p === 'string' && typeof v === 'number').map(([p, v]) => ({ date: normalizePeriod(p), value: v })));
  }
  return out;
}

interface JsonStat {
  id: string[];
  size: number[];
  value: Record<string, number | null> | (number | null)[];
  dimension: Record<string, { category: { index: Record<string, number> } }>;
}

/** Parse a Eurostat JSON-stat response where every dim except geo/time is filtered to one value. */
export function parseEurostatGeoTime(j: JsonStat): SeriesBySource {
  const out: SeriesBySource = new Map();
  const geoPos = j.id.indexOf('geo');
  const timePos = j.id.findIndex(d => d === 'time' || d === 'TIME_PERIOD');
  if (geoPos < 0 || timePos < 0) return out;
  const strides: number[] = new Array(j.size.length).fill(1);
  for (let i = j.size.length - 2; i >= 0; i--) strides[i] = strides[i + 1] * j.size[i + 1];
  const geoIdx = j.dimension[j.id[geoPos]].category.index;
  const timeIdx = j.dimension[j.id[timePos]].category.index;
  for (const [geo, gi] of Object.entries(geoIdx)) {
    const cc = geo === 'UK' ? 'GB' : geo === 'EL' ? 'GR' : geo;
    const pts: Point[] = [];
    const values = j.value as Record<number, number | null | undefined>;
    for (const [t, ti] of Object.entries(timeIdx)) {
      const raw = values[gi * strides[geoPos] + ti * strides[timePos]];
      if (raw === null || raw === undefined || !Number.isFinite(raw)) continue;
      pts.push({ date: normalizePeriod(t), value: raw });
    }
    if (pts.length) out.set(cc, pts);
  }
  return out;
}

async function eurostat(dataset: string, filters: string, timeoutMs: number): Promise<SeriesBySource> {
  const geos = EUROSTAT_GEOS.map(g => `geo=${g}`).join('&');
  const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?format=JSON&lang=EN&${geos}&${filters}&sinceTimePeriod=${START}`;
  return parseEurostatGeoTime(await fetchJson<JsonStat>(url, timeoutMs));
}

export const labourPricesAdapter: LiveAdapter = {
  id: 'labourPrices',
  signals: ['unemployment_momentum', 'inflation_momentum'],

  async fetch({ countryCodes, timeoutMs, now }) {
    const started = Date.now();
    // OECD comes from the committed snapshot (sdmx.oecd.org returns HTTP 500
    // to Vercel's egress IPs). Stale snapshots are caught by MAX_AGE_DAYS.
    const eu = await Promise.allSettled([
      eurostat('une_rt_m', 's_adj=SA&age=TOTAL&sex=T&unit=PC_ACT', timeoutMs),
      eurostat('prc_hicp_minr', 'coicop18=TOTAL&unit=RCH_A', timeoutMs),
    ]);
    // Index order: 0 OECD unemployment, 1 Eurostat unemployment, 2 Eurostat HICP, 3 OECD CPI
    const jobs: PromiseSettledResult<SeriesBySource>[] = [
      { status: 'fulfilled', value: oecdFromSnapshot('unemployment') },
      eu[0],
      eu[1],
      { status: 'fulfilled', value: oecdFromSnapshot('cpi_yoy') },
    ];
    const val = (i: number): SeriesBySource => (jobs[i].status === 'fulfilled' ? (jobs[i] as PromiseFulfilledResult<SeriesBySource>).value : new Map());
    const SOURCE_NAMES = ['oecd:une', 'eurostat:une_rt_m', 'eurostat:hicp', 'oecd:cpi'];
    const errors = jobs.flatMap((j, i) => (j.status === 'rejected' ? [`${SOURCE_NAMES[i]}: ${(j.reason as Error)?.message ?? j.reason}`] : []));

    // Priority order per signal: first source producing a valid (fresh) score wins.
    const plan: { signal: LiveSignalId; sources: { name: string; data: SeriesBySource }[] }[] = [
      { signal: 'unemployment_momentum', sources: [{ name: 'oecd:DF_IALFS_UNE_M (snapshot)', data: val(0) }, { name: 'eurostat:une_rt_m', data: val(1) }] },
      { signal: 'inflation_momentum', sources: [{ name: 'eurostat:prc_hicp_minr', data: val(2) }, { name: 'oecd:DF_PRICES_ALL (snapshot)', data: val(3) }] },
    ];

    const observations: LiveObservation[] = [];
    for (const { signal, sources } of plan) {
      for (const cc of countryCodes) {
        for (const src of sources) {
          const series = src.data.get(cc);
          if (!series) continue;
          const s = scoreMomentum(series, { lag: LAG_MONTHS, kind: 'diff', minHistory: MIN_HISTORY, maxAgeDays: MAX_AGE_DAYS, now });
          if (!s) continue;
          const latest = series.reduce((a, b) => (a.date > b.date ? a : b));
          observations.push({
            countryCode: cc, signalId: signal, rawValue: s.rawValue, stressScore: s.stressScore,
            referenceDate: s.referenceDate, historyN: s.historyN, adapterId: this.id,
            payload: { source: src.name, z: s.zScore, sigma: s.sigma, latest_level: latest.value, lag_months: LAG_MONTHS },
          });
          break;
        }
      }
    }

    const failed = errors.length === jobs.length;
    return {
      observations,
      health: {
        adapter: this.id,
        status: failed ? 'failed' : errors.length ? 'degraded' : 'ok',
        observations: observations.length,
        durationMs: Date.now() - started,
        error: errors.length ? errors.join(' | ').slice(0, 500) : null,
      },
    };
  },
};
