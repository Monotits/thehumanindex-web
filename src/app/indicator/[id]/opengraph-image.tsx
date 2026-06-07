import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { bandFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';

export const runtime = 'edge';
export const alt = 'The Human Index — Indicator ranking';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PALETTE = {
  bg: '#FAFAF8',
  bgAlt: '#F2F2EF',
  fg: '#1A1A1A',
  fgMuted: '#595956',
  fgSubtle: '#8A8A85',
  border: '#E0E0DC',
  bandLow: '#6B8E5A',
  bandModerate: '#D6A35C',
  bandElevated: '#C97447',
  bandHigh: '#A53E3E',
  bandCritical: '#5D1F1F',
  metaEconomic: '#475569',
  metaSocial: '#4F46E5',
  metaMental: '#7C3AED',
  metaTechnological: '#0891B2',
  metaEnvironmental: '#059669',
} as const;

const META_COLOR: Record<MetaIndex, string> = {
  economic: PALETTE.metaEconomic,
  social: PALETTE.metaSocial,
  mental: PALETTE.metaMental,
  technological: PALETTE.metaTechnological,
  environmental: PALETTE.metaEnvironmental,
};

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

interface TopCountry {
  country_name: string;
  flag_emoji: string | null;
  score: number;
}

export default async function IndicatorOGImage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let name = id;
  let meta: MetaIndex | null = null;
  let unit: string | null = null;
  let top: TopCountry[] = [];
  let globalAvg: number | null = null;

  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    const [indRes, valuesRes, countriesRes] = await Promise.all([
      sb.from('indicators').select('name, meta_index, unit').eq('id', id).maybeSingle(),
      sb.from('v_country_latest_indicators').select('country_code, normalized_value').eq('indicator_id', id),
      sb.from('countries').select('code, name, flag_emoji').eq('active', true),
    ]);

    const ind = indRes.data as { name: string; meta_index: MetaIndex; unit: string | null } | null;
    if (ind) {
      name = ind.name;
      meta = ind.meta_index;
      unit = ind.unit;
    }

    const countryMap = new Map<string, { name: string; flag: string | null }>();
    for (const r of (countriesRes.data ?? []) as Array<{
      code: string; name: string; flag_emoji: string | null;
    }>) {
      countryMap.set(r.code, { name: r.name, flag: r.flag_emoji });
    }

    const valid = ((valuesRes.data ?? []) as Array<{
      country_code: string; normalized_value: number | null;
    }>)
      .filter((r) => r.normalized_value !== null)
      .map((r) => ({
        country: r.country_code,
        score: r.normalized_value as number,
        meta: countryMap.get(r.country_code),
      }));

    if (valid.length > 0) {
      globalAvg = Math.round((valid.reduce((s, r) => s + r.score, 0) / valid.length) * 10) / 10;
    }

    top = valid
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => ({
        country_name: r.meta?.name ?? r.country,
        flag_emoji: r.meta?.flag ?? null,
        score: r.score,
      }));
  }

  const metaColor = meta ? META_COLOR[meta] : PALETTE.fgSubtle;
  const globalBandColor = bandColor(bandFor(globalAvg));

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: metaColor }} />
            <div style={{ fontSize: 16, color: PALETTE.fgMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
              {meta ? META_LABELS[meta] : 'Indicator'}
            </div>
          </div>
        </div>

        {/* Center: 2-col layout */}
        <div style={{ display: 'flex', flex: 1, marginTop: 32, gap: 56 }}>
          {/* Left: name + global stat */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 12, color: PALETTE.fgSubtle, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 12 }}>
              By country
            </div>
            <div style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1, marginBottom: 32 }}>
              {name}
            </div>

            {globalAvg !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
                <div style={{ fontSize: 14, color: PALETTE.fgSubtle, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 6 }}>
                  Global average stress
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <div
                    style={{
                      fontSize: 96,
                      fontWeight: 600,
                      lineHeight: 0.9,
                      fontFamily: 'monospace',
                      color: globalBandColor,
                      letterSpacing: -2,
                    }}
                  >
                    {globalAvg.toFixed(1)}
                  </div>
                  {unit && (
                    <div style={{ fontSize: 22, color: PALETTE.fgMuted, fontFamily: 'sans-serif' }}>
                      {unit}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: top 5 ranking */}
          <div style={{ display: 'flex', flexDirection: 'column', width: 460, paddingTop: 32 }}>
            <div style={{ fontSize: 12, color: PALETTE.fgSubtle, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 16 }}>
              Most affected
            </div>
            {top.map((t, i) => (
              <div
                key={t.country_name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: `1px solid ${PALETTE.border}`,
                }}
              >
                <div style={{ fontSize: 18, color: PALETTE.fgSubtle, fontFamily: 'monospace', width: 26, fontWeight: 600 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 32 }}>{t.flag_emoji ?? '🏳️'}</div>
                <div style={{ flex: 1, fontSize: 22, fontWeight: 500 }}>
                  {t.country_name}
                </div>
                <div
                  style={{
                    fontSize: 28,
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
        </div>

        {/* Bottom: URL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${PALETTE.border}` }}>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif' }}>
            Live data · updated every 12 hours
          </div>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif', letterSpacing: 0.5 }}>
            thehumanindex.org/indicator/{id}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
