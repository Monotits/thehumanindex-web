/**
 * Release calendar — when each source is expected to publish its next data.
 *
 * "Expected" dates are estimates from each publisher's usual lag after the
 * end of the reference month, applied to the latest period we actually hold.
 * They are labelled as estimates on the site; the official calendars are
 * linked for exact dates.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReleaseSource {
  id: string;
  name: string;
  /** Short lowercase label for inline mentions ("unemployment"). */
  short: string;
  publisher: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'event' | 'irregular';
  /** Days after the end of the reference month (monthly sources). */
  lagDays?: number;
  /** Live signal(s) whose latest reference_date tells us the period we hold. */
  signalIds?: string[];
  /** Restrict the "latest period" lookup to one adapter payload source prefix. */
  calendarUrl: string;
  note?: string;
}

export const RELEASE_SOURCES: ReleaseSource[] = [
  { id: 'eurostat-hicp', short: 'inflation', name: 'Inflation, HICP (Europe, TR)', publisher: 'Eurostat', cadence: 'monthly', lagDays: 17,
    signalIds: ['inflation_momentum'], calendarUrl: 'https://ec.europa.eu/eurostat/news/release-calendar',
    note: 'Euro-area flash estimate ~1 day after month end; country detail ~17 days.' },
  { id: 'oecd-monthly', short: 'unemployment & CPI', name: 'Unemployment (17 countries) & CPI (outside Europe)', publisher: 'OECD', cadence: 'monthly', lagDays: 45,
    calendarUrl: 'https://www.oecd.org/en/data/insights/statistical-releases.html',
    note: 'Primary source for unemployment; Eurostat is the fallback. Collected daily via GitHub Actions because OECD blocks direct requests from our host.' },
  { id: 'gpr', short: 'geopolitical risk', name: 'Geopolitical risk index', publisher: 'Caldara & Iacoviello', cadence: 'monthly', lagDays: 5,
    signalIds: ['geopolitical_risk'], calendarUrl: 'https://www.matteoiacoviello.com/gpr.htm', note: 'Updated early each month.' },
  { id: 'epu', short: 'policy uncertainty', name: 'Economic policy uncertainty', publisher: 'policyuncertainty.com', cadence: 'monthly', lagDays: 75,
    signalIds: ['policy_uncertainty'], calendarUrl: 'https://www.policyuncertainty.com/all_country_data.html', note: 'Country series update with a lag of about 2–3 months.' },
  { id: 'ecb-fx', short: 'exchange rates', name: 'Exchange rates', publisher: 'European Central Bank', cadence: 'daily',
    signalIds: ['fx_pressure'], calendarUrl: 'https://data.ecb.europa.eu/data/datasets/EXR', note: 'Every TARGET business day, ~16:00 CET.' },
  { id: 'indeed', short: 'job postings', name: 'Job postings', publisher: 'Indeed Hiring Lab', cadence: 'weekly',
    signalIds: ['job_postings_momentum'], calendarUrl: 'https://github.com/hiring-lab/job_postings_tracker', note: 'Daily series, published in weekly batches.' },
  { id: 'gdacs', short: 'disaster alerts', name: 'Disaster alerts', publisher: 'GDACS (UN OCHA / EC JRC)', cadence: 'event',
    calendarUrl: 'https://www.gdacs.org/', note: 'Continuous; checked daily.' },
  { id: 'worldbank', short: 'annual indicators', name: 'Annual indicators (15)', publisher: 'World Bank', cadence: 'irregular',
    calendarUrl: 'https://datatopics.worldbank.org/world-development-indicators/', note: 'World Development Indicators update several times a year; we re-read monthly.' },
  { id: 'reference', short: 'survey indicators', name: 'Survey & report indicators (14)', publisher: 'Gallup, OECD, WHO, IHME, DataReportal, others', cadence: 'irregular',
    calendarUrl: 'https://thehumanindex.org/methodology', note: 'Annual reports; refreshed by hand when a new edition is published.' },
];

export interface ReleaseRow extends ReleaseSource {
  latestPeriod: string | null;   // 'YYYY-MM-DD'
  nextPeriod: string | null;     // first day of the next reference month
  expectedAt: string | null;     // estimated publication date
  status: 'upcoming' | 'due' | 'continuous' | 'unscheduled';
}

const addMonths = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00Z');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)).toISOString().slice(0, 10);
};

/** Pure: compute expected dates from latest held periods. */
export function computeReleases(latestBySignal: Record<string, string>, oecdLatest: string | null, now = new Date()): ReleaseRow[] {
  return RELEASE_SOURCES.map(src => {
    if (src.cadence === 'daily' || src.cadence === 'weekly' || src.cadence === 'event') {
      const latest = src.signalIds?.map(s => latestBySignal[s]).filter(Boolean).sort().pop() ?? null;
      return { ...src, latestPeriod: latest, nextPeriod: null, expectedAt: null, status: 'continuous' as const };
    }
    if (src.cadence === 'irregular') {
      return { ...src, latestPeriod: null, nextPeriod: null, expectedAt: null, status: 'unscheduled' as const };
    }
    const latest = src.id === 'oecd-monthly'
      ? oecdLatest
      : (src.signalIds?.map(s => latestBySignal[s]).filter(Boolean).sort().pop() ?? null);
    if (!latest) return { ...src, latestPeriod: null, nextPeriod: null, expectedAt: null, status: 'unscheduled' as const };
    const nextPeriod = addMonths(latest, 1);
    const nextMonthEnd = new Date(new Date(addMonths(nextPeriod, 1) + 'T00:00:00Z').getTime() - 86_400_000);
    const expected = new Date(nextMonthEnd.getTime() + (src.lagDays ?? 30) * 86_400_000).toISOString().slice(0, 10);
    return { ...src, latestPeriod: latest, nextPeriod, expectedAt: expected, status: expected <= now.toISOString().slice(0, 10) ? 'due' as const : 'upcoming' as const };
  });
}

/** Latest reference_date per live signal, from the newest snapshot. */
export async function loadLatestPeriods(sb: SupabaseClient): Promise<{ bySignal: Record<string, string>; oecd: string | null }> {
  try {
    const { data } = await sb
      .from('live_signal_values')
      .select('signal_id, reference_date, payload, snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(200);
    const bySignal: Record<string, string> = {};
    let oecd: string | null = null;
    const newest = data?.[0]?.snapshot_date;
    for (const r of data ?? []) {
      if (r.snapshot_date !== newest) continue;
      const src = (r.payload as { source?: string } | null)?.source ?? '';
      if (src.startsWith('oecd')) {
        if (!oecd || r.reference_date > oecd) oecd = r.reference_date;
        continue; // OECD-sourced rows don't define Eurostat's period
      }
      if (!bySignal[r.signal_id] || r.reference_date > bySignal[r.signal_id]) bySignal[r.signal_id] = r.reference_date;
    }
    return { bySignal, oecd };
  } catch {
    return { bySignal: {}, oecd: null };
  }
}
