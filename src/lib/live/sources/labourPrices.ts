/**
 * Monthly unemployment + inflation momentum.
 *
 * Sources (all free, no key):
 *   - OECD Infra-annual Labour Statistics, DF_IALFS_UNE_M (monthly unemployment, SA)
 *   - OECD Prices, DF_PRICES_ALL (CPI, YoY growth, national methodology)
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
import { csvRecords, fetchJson, fetchText, normalizePeriod, ISO2_TO_ISO3, ISO3_TO_ISO2 } from '../http';

const START = '2010-01';
const LAG_MONTHS = 6;
const MIN_HISTORY = 60;      // 5 years of monthly momentum points
const MAX_AGE_DAYS = 150;    // period start → today; monthly releases lag ~1-2 months

const EUROSTAT_GEOS = ['FR', 'DE', 'IT', 'NL', 'ES', 'SE', 'PL', 'NO', 'CH', 'TR', 'US', 'JP'];

type SeriesBySource = Map<string, Point[]>; // countryCode → series

async function oecdSeries(url: string, timeoutMs: number, keep: (r: Record<string, string>) => boolean): Promise<SeriesBySource> {
  const recs = csvRecords(await fetchText(url, timeoutMs, 'text/csv'));
  const out: SeriesBySource = new Map();
  for (const r of recs) {
    if (!keep(r)) continue;
    const cc = ISO3_TO_ISO2[r.REF_AREA];
    const v = parseFloat(r.OBS_VALUE);
    if (!cc || !Number.isFinite(v) || !r.TIME_PERIOD) continue;
    if (!out.has(cc)) out.set(cc, []);
    out.get(cc)!.push({ date: normalizePeriod(r.TIME_PERIOD), value: v });
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
    const iso3 = countryCodes.map(c => ISO2_TO_ISO3[c]).filter(Boolean).join('+');
    const oecdBase = 'https://sdmx.oecd.org/public/rest/data';

    const jobs = await Promise.allSettled([
      oecdSeries(`${oecdBase}/OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0/${iso3}..._Z.Y._T.Y_GE15..M?startPeriod=${START}&format=csv`,
        timeoutMs, r => r.MEASURE === 'UNE_LF_M' && r.UNIT_MEASURE === 'PT_LF_SUB'),
      eurostat('une_rt_m', 's_adj=SA&age=TOTAL&sex=T&unit=PC_ACT', timeoutMs),
      eurostat('prc_hicp_minr', 'coicop18=TOTAL&unit=RCH_A', timeoutMs),
      oecdSeries(`${oecdBase}/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${iso3}.M.N.CPI.PA._T.N.GY?startPeriod=${START}&format=csv`,
        timeoutMs, () => true),
    ]);
    const val = (i: number): SeriesBySource => (jobs[i].status === 'fulfilled' ? (jobs[i] as PromiseFulfilledResult<SeriesBySource>).value : new Map());
    const errors = jobs.flatMap((j, i) => (j.status === 'rejected' ? [`#${i}: ${(j.reason as Error)?.message ?? j.reason}`] : []));

    // Priority order per signal: first source producing a valid (fresh) score wins.
    const plan: { signal: LiveSignalId; sources: { name: string; data: SeriesBySource }[] }[] = [
      { signal: 'unemployment_momentum', sources: [{ name: 'oecd:DF_IALFS_UNE_M', data: val(0) }, { name: 'eurostat:une_rt_m', data: val(1) }] },
      { signal: 'inflation_momentum', sources: [{ name: 'eurostat:prc_hicp_minr', data: val(2) }, { name: 'oecd:DF_PRICES_ALL', data: val(3) }] },
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
            payload: { source: src.name, latest_level: latest.value, lag_months: LAG_MONTHS },
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
