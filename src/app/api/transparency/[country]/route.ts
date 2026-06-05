/**
 * GET /api/transparency/[country] — full sourcing audit for one country
 *
 * Returns, for every indicator tracked for this country:
 *   - The currently-published value (primary source)
 *   - Every adapter's most recent reading (cross-source breakdown)
 *   - Divergence history over the last 30 days (count of warnings)
 *
 * This is the surface that powers a public "How did you compute this?"
 * page — credibility through radical transparency. Every stress score in
 * The Human Index should be drillable down to "X.X from World Bank
 * 2024-12-31 / Y.Y from IMF 2024-12-31 / divergence Z% (warning)".
 *
 * Public, cached for 5 minutes on the edge. ISR-friendly.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min

interface SourceBreakdownRow {
  country_code: string;
  indicator_id: string;
  adapter_id: string;
  raw_value: number;
  normalized_value: number | null;
  reference_date: string;
  recorded_at: string;
}

interface DivergenceStreakRow {
  country_code: string;
  indicator_id: string;
  divergent_runs: number;
  observed_runs: number;
  avg_divergence_pct_when_warning: number | null;
  last_divergent_at: string | null;
}

interface IndicatorMetaRow {
  id: string;
  name: string;
  meta_index: string;
  unit: string | null;
  source_org: string | null;
  source_url: string | null;
}

interface CountryRow {
  code: string;
  name: string;
  region: string | null;
  flag_emoji: string | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country: rawCountry } = await params;
  const countryCode = rawCountry.toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid country code (must be ISO 3166-1 alpha-2)' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'Server misconfigured' },
      { status: 500 }
    );
  }

  const sb = createClient(supabaseUrl, anonKey);

  // Fan out: country meta, indicator registry, source breakdown, divergence streaks.
  const [countryRes, indicatorsRes, breakdownRes, streaksRes] = await Promise.all([
    sb.from('countries').select('code,name,region,flag_emoji').eq('code', countryCode).single(),
    sb.from('indicators').select('id,name,meta_index,unit,source_org,source_url').eq('active', true),
    sb
      .from('v_indicator_source_breakdown')
      .select('*')
      .eq('country_code', countryCode),
    sb
      .from('v_recent_divergence_streaks')
      .select('*')
      .eq('country_code', countryCode),
  ]);

  if (countryRes.error || !countryRes.data) {
    return NextResponse.json(
      { ok: false, error: `Country ${countryCode} not found` },
      { status: 404 }
    );
  }

  const indicators = (indicatorsRes.data ?? []) as IndicatorMetaRow[];
  const breakdown = (breakdownRes.data ?? []) as SourceBreakdownRow[];
  const streaks = (streaksRes.data ?? []) as DivergenceStreakRow[];

  // Group breakdown by indicator
  const byIndicator = new Map<string, SourceBreakdownRow[]>();
  for (const row of breakdown) {
    const arr = byIndicator.get(row.indicator_id) ?? [];
    arr.push(row);
    byIndicator.set(row.indicator_id, arr);
  }

  // Index streaks by indicator
  const streakByIndicator = new Map<string, DivergenceStreakRow>();
  for (const s of streaks) streakByIndicator.set(s.indicator_id, s);

  const indicatorReports = indicators.map(ind => {
    const sources = (byIndicator.get(ind.id) ?? []).sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );
    const primarySource = sources[0] ?? null;

    // Cross-source range
    const numericValues = sources
      .map(s => Number(s.raw_value))
      .filter(v => Number.isFinite(v));
    let crossSourceRange: { min: number; max: number; spreadPct: number } | null = null;
    if (numericValues.length >= 2) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const spread = mean !== 0 ? Math.abs((max - min) / mean) * 100 : 0;
      crossSourceRange = {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        spreadPct: Math.round(spread * 10) / 10,
      };
    }

    const streak = streakByIndicator.get(ind.id);

    return {
      indicator_id: ind.id,
      name: ind.name,
      meta_index: ind.meta_index,
      unit: ind.unit,
      official_source: { org: ind.source_org, url: ind.source_url },
      primary: primarySource && {
        adapter: primarySource.adapter_id,
        raw_value: Number(primarySource.raw_value),
        normalized_value:
          primarySource.normalized_value !== null
            ? Number(primarySource.normalized_value)
            : null,
        reference_date: primarySource.reference_date,
        recorded_at: primarySource.recorded_at,
      },
      sources: sources.map(s => ({
        adapter: s.adapter_id,
        raw_value: Number(s.raw_value),
        reference_date: s.reference_date,
        recorded_at: s.recorded_at,
      })),
      cross_source_range: crossSourceRange,
      divergence: streak
        ? {
            divergent_runs: streak.divergent_runs,
            observed_runs: streak.observed_runs,
            avg_pct_when_warning: streak.avg_divergence_pct_when_warning,
            last_divergent_at: streak.last_divergent_at,
            status:
              streak.divergent_runs >= 5
                ? 'persistent'
                : streak.divergent_runs >= 2
                ? 'recurring'
                : 'occasional',
          }
        : null,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      country: countryRes.data as CountryRow,
      generated_at: new Date().toISOString(),
      indicator_count: indicatorReports.length,
      indicators_with_multiple_sources: indicatorReports.filter(
        r => r.sources.length > 1
      ).length,
      divergence_streaks_active: streaks.length,
      indicators: indicatorReports,
    },
    {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
