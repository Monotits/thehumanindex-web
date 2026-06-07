import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { bandFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { getTop10Entry } from '@/lib/ui/top10-catalog';

export const runtime = 'edge';
export const alt = 'The Human Index — Country ranking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PALETTE = {
  bg: '#FAFAF8',
  fg: '#1A1A1A',
  fgMuted: '#595956',
  fgSubtle: '#8A8A85',
  border: '#E0E0DC',
  bandLow: '#6B8E5A',
  bandModerate: '#D6A35C',
  bandElevated: '#C97447',
  bandHigh: '#A53E3E',
  bandCritical: '#5D1F1F',
} as const;

function bandColor(b: ReturnType<typeof bandFor>): string {
  switch (b) {
    case 'low': return PALETTE.bandLow;
    case 'moderate': return PALETTE.bandModerate;
    case 'elevated': return PALETTE.bandElevated;
    case 'high': return PALETTE.bandHigh;
    case 'critical': return PALETTE.bandCritical;
    default: return PALETTE.fgSubtle;
  }
}

interface Ranked {
  country_name: string;
  flag_emoji: string | null;
  score: number;
}

export default async function Top10OGImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const entry = getTop10Entry(slug);
  if (!entry) {
    return new ImageResponse(
      (<div style={{ width: '100%', height: '100%', background: PALETTE.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE.fg, fontSize: 32 }}>The Human Index</div>),
      size,
    );
  }

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let top: Ranked[] = [];

  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    const countriesRes = await sb
      .from('countries')
      .select('code, name, flag_emoji')
      .eq('active', true);
    const countryMap = new Map<string, { name: string; flag: string | null }>();
    for (const r of (countriesRes.data ?? []) as Array<{
      code: string; name: string; flag_emoji: string | null;
    }>) {
      countryMap.set(r.code, { name: r.name, flag: r.flag_emoji });
    }

    let rows: Array<{ country_code: string; score: number }> = [];
    if (entry.source.kind === 'composite') {
      const res = await sb.from('v_country_latest_composite').select('country_code, score_value');
      rows = ((res.data ?? []) as Array<{ country_code: string; score_value: number }>)
        .map((r) => ({ country_code: r.country_code, score: r.score_value }));
    } else if (entry.source.kind === 'meta') {
      const res = await sb
        .from('v_country_latest_meta_indexes')
        .select('country_code, value')
        .eq('meta_index', entry.source.meta_index);
      rows = ((res.data ?? []) as Array<{ country_code: string; value: number | null }>)
        .filter((r) => r.value !== null)
        .map((r) => ({ country_code: r.country_code, score: r.value as number }));
    } else {
      const res = await sb
        .from('v_country_latest_indicators')
        .select('country_code, normalized_value')
        .eq('indicator_id', entry.source.indicator_id);
      rows = ((res.data ?? []) as Array<{ country_code: string; normalized_value: number | null }>)
        .filter((r) => r.normalized_value !== null)
        .map((r) => ({ country_code: r.country_code, score: r.normalized_value as number }));
    }

    rows.sort((a, b) => (entry.direction === 'most' ? b.score - a.score : a.score - b.score));
    top = rows.slice(0, 5).map((r) => ({
      country_name: countryMap.get(r.country_code)?.name ?? r.country_code,
      flag_emoji: countryMap.get(r.country_code)?.flag ?? null,
      score: r.score,
    }));
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PALETTE.bg,
          padding: '64px 72px',
          fontFamily: 'serif',
          color: PALETTE.fg,
        }}
      >
        {/* Top: wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: PALETTE.fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: PALETTE.bg,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              H
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>The Human Index</div>
          </div>
          <div style={{ fontSize: 16, color: PALETTE.fgMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Live ranking · {new Date().getFullYear()}
          </div>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1, marginTop: 28, marginBottom: 8, maxWidth: 950 }}>
          {entry.title}
        </div>
        <div style={{ fontSize: 22, color: PALETTE.fgMuted, fontFamily: 'sans-serif', marginBottom: 28 }}>
          {entry.subhead}
        </div>

        {/* Ranking */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {top.map((t, i) => (
            <div
              key={t.country_name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '14px 0',
                borderBottom: `1px solid ${PALETTE.border}`,
              }}
            >
              <div style={{ fontSize: 36, color: PALETTE.fgMuted, fontFamily: 'monospace', width: 60, fontWeight: 600 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 44 }}>{t.flag_emoji ?? '🏳️'}</div>
              <div style={{ flex: 1, fontSize: 32, fontWeight: 500 }}>
                {t.country_name}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: bandColor(bandFor(t.score)),
                }}
              >
                {t.score.toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif' }}>
            Updated every 12 hours · sourced from official statistics
          </div>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif', letterSpacing: 0.5 }}>
            thehumanindex.org/top-10/{slug}
          </div>
        </div>

        {/* Suppress unused */}
        {void META_LABELS as unknown as null}
      </div>
    ),
    size,
  );
}
