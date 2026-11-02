/**
 * Currency pressure from ECB euro foreign exchange reference rates.
 *
 * ECB publishes X-per-EUR daily. We derive local-currency-per-USD
 * (X/EUR ÷ USD/EUR; EUR countries use 1 ÷ USD/EUR) and score the
 * 63-business-day (~3 months) percent change against the country's own
 * history since 2015. Positive = local currency weakening = more stress.
 *
 * Not covered: US (reserve currency — USD/USD is undefined), AR (ECB
 * stopped ARS in 2020), AE (AED is pegged to USD).
 */

import type { LiveAdapter, LiveObservation } from '../types';
import { scoreMomentum, type Point } from '../scoring';
import { csvRecords, fetchText } from '../http';

const CURRENCY: Record<string, string> = {
  AU: 'AUD', BR: 'BRL', CA: 'CAD', FR: 'EUR', DE: 'EUR', IT: 'EUR', NL: 'EUR', ES: 'EUR',
  IN: 'INR', IL: 'ILS', JP: 'JPY', MX: 'MXN', NZ: 'NZD', NO: 'NOK', PL: 'PLN', SG: 'SGD',
  ZA: 'ZAR', KR: 'KRW', SE: 'SEK', CH: 'CHF', TR: 'TRY', GB: 'GBP',
};
const LAG = 63;
const MIN_HISTORY = 500;
const MAX_AGE_DAYS = 10;

export const ecbFxAdapter: LiveAdapter = {
  id: 'ecbFx',
  signals: ['fx_pressure'],

  async fetch({ countryCodes, timeoutMs, now }) {
    const started = Date.now();
    const wanted = countryCodes.filter(c => CURRENCY[c]);
    const ccys = Array.from(new Set(wanted.map(c => CURRENCY[c]).filter(c => c !== 'EUR')));
    const startYear = (now ?? new Date()).getUTCFullYear() - 11;
    const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${['USD', ...ccys].join('+')}.EUR.SP00.A?startPeriod=${startYear}-01-01&format=csvdata&detail=dataonly`;

    try {
      const recs = csvRecords(await fetchText(url, timeoutMs, 'text/csv'));
      const perEur = new Map<string, Map<string, number>>(); // ccy → date → X per EUR
      for (const r of recs) {
        const v = parseFloat(r.OBS_VALUE);
        if (!r.CURRENCY || !r.TIME_PERIOD || !Number.isFinite(v) || v <= 0) continue;
        if (!perEur.has(r.CURRENCY)) perEur.set(r.CURRENCY, new Map());
        perEur.get(r.CURRENCY)!.set(r.TIME_PERIOD, v);
      }
      const usd = perEur.get('USD');
      if (!usd || usd.size === 0) throw new Error('ECB: no USD series');

      const seriesFor = (ccy: string): Point[] => {
        const pts: Point[] = [];
        for (const [date, usdPerEur] of usd) {
          if (ccy === 'EUR') pts.push({ date, value: 1 / usdPerEur });
          else {
            const x = perEur.get(ccy)?.get(date);
            if (x !== undefined) pts.push({ date, value: x / usdPerEur });
          }
        }
        return pts.sort((a, b) => (a.date < b.date ? -1 : 1));
      };

      const cache = new Map<string, Point[]>();
      const observations: LiveObservation[] = [];
      for (const cc of wanted) {
        const ccy = CURRENCY[cc];
        if (!cache.has(ccy)) cache.set(ccy, seriesFor(ccy));
        const series = cache.get(ccy)!;
        const s = scoreMomentum(series, { lag: LAG, kind: 'pct', minHistory: MIN_HISTORY, maxAgeDays: MAX_AGE_DAYS, now });
        if (!s) continue;
        observations.push({
          countryCode: cc, signalId: 'fx_pressure', rawValue: s.rawValue, stressScore: s.stressScore,
          referenceDate: s.referenceDate, historyN: s.historyN, adapterId: this.id,
          payload: { currency: ccy, local_per_usd: series[series.length - 1].value, lag_business_days: LAG },
        });
      }
      return {
        observations,
        health: { adapter: this.id, status: observations.length ? 'ok' : 'degraded', observations: observations.length, durationMs: Date.now() - started, error: null },
      };
    } catch (e) {
      return {
        observations: [],
        health: { adapter: this.id, status: 'failed', observations: 0, durationMs: Date.now() - started, error: (e as Error).message },
      };
    }
  },
};
