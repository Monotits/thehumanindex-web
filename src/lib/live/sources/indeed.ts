/**
 * Job postings momentum — Indeed Hiring Lab Job Postings Index (CC BY 4.0).
 * https://github.com/hiring-lab/job_postings_tracker
 *
 * Daily, seasonally adjusted index (Feb 1 2020 = 100). Score: 90-day percent
 * change, percentile vs the country's own history since 2020, INVERTED
 * (falling postings = higher stress).
 */

import type { LiveAdapter, LiveObservation } from '../types';
import { scoreMomentum, type Point } from '../scoring';
import { csvRecords, fetchText } from '../http';

const COVERED = ['AU', 'CA', 'DE', 'ES', 'FR', 'GB', 'IT', 'NL', 'US'];
const LAG_DAYS = 90;
const MIN_HISTORY = 365;
const MAX_AGE_DAYS = 21;

const RAW = 'https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master';

export const indeedAdapter: LiveAdapter = {
  id: 'indeed',
  signals: ['job_postings_momentum'],

  async fetch({ countryCodes, timeoutMs, now }) {
    const started = Date.now();
    const wanted = countryCodes.filter(c => COVERED.includes(c));
    const errors: string[] = [];
    const observations: LiveObservation[] = [];

    await Promise.all(wanted.map(async cc => {
      try {
        const recs = csvRecords(await fetchText(`${RAW}/${cc}/aggregate_job_postings_${cc}.csv`, timeoutMs, 'text/csv'));
        const series: Point[] = recs
          .filter(r => r.variable === 'total postings')
          .map(r => ({ date: r.date, value: parseFloat(r.indeed_job_postings_index_SA) }))
          .filter(p => p.date && Number.isFinite(p.value));
        const s = scoreMomentum(series, { lag: LAG_DAYS, kind: 'pct', invert: true, minHistory: MIN_HISTORY, maxAgeDays: MAX_AGE_DAYS, now });
        if (!s) return;
        observations.push({
          countryCode: cc, signalId: 'job_postings_momentum', rawValue: s.rawValue, stressScore: s.stressScore,
          referenceDate: s.referenceDate, historyN: s.historyN, adapterId: this.id,
          payload: { z: s.zScore, sigma: s.sigma, index_sa: series[series.length - 1].value, lag_days: LAG_DAYS, license: 'CC BY 4.0' },
        });
      } catch (e) {
        errors.push(`${cc}: ${(e as Error).message}`);
      }
    }));

    return {
      observations,
      health: {
        adapter: this.id,
        status: errors.length === wanted.length && wanted.length > 0 ? 'failed' : errors.length ? 'degraded' : 'ok',
        observations: observations.length,
        durationMs: Date.now() - started,
        error: errors.length ? errors.join(' | ').slice(0, 500) : null,
      },
    };
  },
};
