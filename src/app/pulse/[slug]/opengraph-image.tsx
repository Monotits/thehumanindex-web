import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'The Human Index — Weekly Pulse';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PALETTE = {
  bg: '#FAFAF8',
  fg: '#1A1A1A',
  fgMuted: '#595956',
  fgSubtle: '#8A8A85',
  border: '#E0E0DC',
  accent: '#1F4F8A',
} as const;

interface PulseData {
  title: string;
  country_code: string;
  country_name: string;
  flag_emoji: string;
  published_at: string;
}

export default async function PulseOGImage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let pulse: PulseData | null = null;

  if (sbUrl && sbKey) {
    const sb = createClient(sbUrl, sbKey);
    const res = await sb
      .from('commentary')
      .select('title, country_code, published_at')
      .eq('slug', slug)
      .eq('locale', 'en')
      .maybeSingle();
    const data = res.data as {
      title: string;
      country_code: string;
      published_at: string;
    } | null;

    if (data) {
      let countryName = data.country_code === 'global' ? 'Global' : data.country_code;
      let flag = data.country_code === 'global' ? '🌐' : '🏳️';
      if (data.country_code !== 'global') {
        const cRes = await sb
          .from('countries')
          .select('name, flag_emoji')
          .eq('code', data.country_code)
          .maybeSingle();
        const c = cRes.data as { name: string; flag_emoji: string | null } | null;
        if (c) {
          countryName = c.name;
          flag = c.flag_emoji ?? '🏳️';
        }
      }
      pulse = {
        title: data.title,
        country_code: data.country_code,
        country_name: countryName,
        flag_emoji: flag,
        published_at: data.published_at,
      };
    }
  }

  const title = pulse?.title ?? 'Weekly Pulse';
  const country = pulse?.country_name ?? '';
  const flag = pulse?.flag_emoji ?? '';
  const dateStr = pulse?.published_at
    ? new Date(pulse.published_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PALETTE.bg,
          padding: '64px 80px',
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
            Weekly Pulse
          </div>
        </div>

        {/* Country chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 64, marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>{flag}</div>
          <div style={{ fontSize: 20, color: PALETTE.fgMuted, fontFamily: 'sans-serif', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {country}
          </div>
        </div>

        {/* Title — center stage */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
          <div
            style={{
              fontSize: title.length > 80 ? 52 : title.length > 50 ? 62 : 72,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${PALETTE.border}` }}>
          <div style={{ fontSize: 16, color: PALETTE.fgMuted, fontFamily: 'sans-serif' }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 14, color: PALETTE.fgSubtle, fontFamily: 'sans-serif', letterSpacing: 0.5 }}>
            thehumanindex.org/pulse
          </div>
        </div>
      </div>
    ),
    size,
  );
}
