import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { bandFor, META_INDEXES, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';

export const runtime = 'edge';
export const alt = 'The Human Index — Country stress profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Mirror of the design tokens — we can't read CSS variables inside the
// Edge runtime, so we hardcode the same palette here.
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

function bandColor(band: ReturnType<typeof bandFor>): string {
  switch (band) {
    case 'low': return PALETTE.bandLow;
    case 'moderate': return PALETTE.bandModerate;
    case 'elevated': return PALETTE.bandElevated;
    case 'high': return PALETTE.bandHigh;
    case 'critical': return PALETTE.bandCritical;
    default: return PALETTE.fgSubtle;
  }
}

export default async function CountryOGImage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let countryName = code;
  let flag = '🏳️';
  let composite: number | null = null;
  let metaValues: Partial<Record<MetaIndex, number>> = {};

  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    const [countryRes, compositeRes, metaRes] = await Promise.all([
      sb.from('countries').select('name, flag_emoji').eq('code', code).maybeSingle(),
      sb.from('v_country_latest_composite').select('score_value').eq('country_code', code).maybeSingle(),
      sb.from('v_country_latest_meta_indexes').select('meta_index, value').eq('country_code', code),
    ]);
    const c = countryRes.data as { name: string; flag_emoji: string | null } | null;
    if (c) {
      countryName = c.name;
      flag = c.flag_emoji ?? '🏳️';
    }
    const comp = compositeRes.data as { score_value: number } | null;
    composite = comp?.score_value ?? null;
    for (const row of (metaRes.data ?? []) as Array<{ meta_index: MetaIndex; value: number | null }>) {
      if (row.value !== null) metaValues[row.meta_index] = row.value;
    }
  }

  const band = bandFor(composite);
  const compositeColor = bandColor(band);

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
                fontFamily: 'serif',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              H
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>
              The Human Index
            </div>
          </div>
          <div style={{ fontSize: 16, color: PALETTE.fgMuted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Country profile
          </div>
        </div>

        {/* Center: country */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
            <div style={{ fontSize: 120, lineHeight: 1 }}>{flag}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 80, fontWeight: 600, lineHeight: 1.05, letterSpacing: -1.5, marginBottom: 8 }}>
                {countryName}
              </div>
              <div style={{ fontSize: 20, color: PALETTE.fgMuted, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
                Civilizational stress · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Composite + band pill */}
          {composite !== null && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: 48 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 16, color: PALETTE.fgSubtle, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'sans-serif', marginBottom: 8 }}>
                  Composite stress
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <div
                    style={{
                      fontSize: 144,
                      fontWeight: 600,
                      lineHeight: 0.9,
                      fontFamily: 'monospace',
                      color: compositeColor,
                      letterSpacing: -3,
                    }}
                  >
                    {composite.toFixed(1)}
                  </div>
                  {band && (
                    <div
                      style={{
                        background: compositeColor,
                        color: '#fff',
                        padding: '8px 18px',
                        borderRadius: 999,
                        fontSize: 18,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        fontFamily: 'sans-serif',
                      }}
                    >
                      {band}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: 5 meta dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: `1px solid ${PALETTE.border}` }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {META_INDEXES.map((m) => {
              const v = metaValues[m];
              return (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: META_COLOR[m],
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: 12, color: PALETTE.fgSubtle, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'sans-serif' }}>
                      {META_LABELS[m]}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'monospace', color: PALETTE.fg }}>
                      {v !== undefined ? v.toFixed(1) : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif', letterSpacing: 0.5 }}>
            thehumanindex.org/country/{code.toLowerCase()}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
