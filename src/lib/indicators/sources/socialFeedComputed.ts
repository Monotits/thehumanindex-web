/**
 * Social Feed Computed Adapter — ai_job_anxiety
 *
 * Derives the AI Job Anxiety indicator from the existing social_feed_curated
 * table (Claude Haiku-enriched Reddit + news items, populated by the PD
 * dashboard's social-feed module).
 *
 * Computation (last 30 days):
 *   - share = (items tagged 'work_risk') / total items, %
 *   - avgRel = mean relevance_score of work_risk-tagged items (0-10)
 *   - rawValue = (share% × 2.5) × 0.4 + (avgRel × 10) × 0.6
 *
 * The raw value lands in roughly 0-100 range. The indicator's
 * normalize_low=20, normalize_high=80 then maps it to a 0-100 stress score.
 *
 * Caveat: the social feed is currently English-centric (US/global discourse).
 * We apply the same value to all 25 countries as a v1 proxy. v2 will add
 * per-country social monitoring (Turkish Twitter, JP forums, etc.).
 */

import {
  IndicatorAdapter,
  IndicatorMeasurement,
  AdapterHealth,
} from '../types';
import { createClient } from '@supabase/supabase-js';

const PROVIDED_INDICATORS = new Set(['ai_job_anxiety']);

interface SocialFeedRow {
  relevance_score: number | null;
  domain_tags: string[] | null;
  published_at: string;
}

export const socialFeedComputedAdapter: IndicatorAdapter = {
  id: 'socialFeedComputed',
  name: 'Social Feed Computed (ai_job_anxiety)',
  providedIndicators: PROVIDED_INDICATORS,

  async fetchValues({ countries, indicatorIds, timeoutMs = 10_000 }) {
    const startedAt = Date.now();
    const wantAnxiety = indicatorIds.includes('ai_job_anxiety');
    if (!wantAnxiety) {
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return {
        measurements: [],
        health: {
          adapter: this.id,
          status: 'failed',
          countriesRequested: countries.length,
          countriesReturned: 0,
          indicatorsRequested: 1,
          measurementsReturned: 0,
          durationMs: Date.now() - startedAt,
          error: 'Supabase env vars missing',
        },
      };
    }

    const sb = createClient(url, anon);
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();

    let recent: SocialFeedRow[] = [];
    let error: string | null = null;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const { data, error: fetchErr } = await sb
          .from('social_feed_curated')
          .select('relevance_score, domain_tags, published_at')
          .gte('published_at', cutoff)
          .limit(500)
          .abortSignal(controller.signal);
        if (fetchErr) error = fetchErr.message;
        else if (Array.isArray(data)) recent = data as SocialFeedRow[];
      } finally {
        clearTimeout(t);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    if (error || recent.length === 0) {
      return {
        measurements: [],
        health: {
          adapter: this.id,
          status: 'failed',
          countriesRequested: countries.length,
          countriesReturned: 0,
          indicatorsRequested: 1,
          measurementsReturned: 0,
          durationMs: Date.now() - startedAt,
          error: error ?? 'No social feed data in last 30 days',
        },
      };
    }

    const totalItems = recent.length;
    const workRiskItems = recent.filter(r =>
      Array.isArray(r.domain_tags) && r.domain_tags.includes('work_risk')
    );
    const workRiskCount = workRiskItems.length;
    const avgRelevance = workRiskCount > 0
      ? workRiskItems.reduce((s, r) => s + (r.relevance_score ?? 0), 0) / workRiskCount
      : 0;

    // Composite anxiety calculation
    const sharePercent = (workRiskCount / totalItems) * 100;
    const shareScore = Math.min(100, sharePercent * 2.5);       // 40% share = 100
    const relevanceScore = Math.min(100, avgRelevance * 10);     // 10/10 = 100
    const composite = Math.round((shareScore * 0.4 + relevanceScore * 0.6) * 10) / 10;

    const referenceDate = new Date().toISOString().slice(0, 10);
    const measurements: IndicatorMeasurement[] = countries.map(c => ({
      countryCode: c.code,
      indicatorId: 'ai_job_anxiety',
      rawValue: composite,
      referenceDate,
      payload: {
        proxy: 'global_social_feed_for_all_countries',
        total_items: totalItems,
        work_risk_count: workRiskCount,
        share_percent: Math.round(sharePercent * 10) / 10,
        avg_relevance: Math.round(avgRelevance * 10) / 10,
        window_days: 30,
      },
    }));

    const health: AdapterHealth = {
      adapter: this.id,
      status: 'ok',
      countriesRequested: countries.length,
      countriesReturned: countries.length,
      indicatorsRequested: 1,
      measurementsReturned: measurements.length,
      durationMs: Date.now() - startedAt,
      error: null,
    };

    return { measurements, health };
  },
};
