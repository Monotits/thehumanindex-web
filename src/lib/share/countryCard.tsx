/**
 * Country share card renderer (next/og), shared by /share/country/{iso2}
 * (story 1080×1920, square 1080×1080) and the page's Open Graph image
 * (og 1200×630).
 * One headline built from real data (rank among tracked countries), a
 * ranking strip, the Live alert and a "where does your country rank?" hook.
 * Claims stay factual: every line is computed from the published numbers.
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { bandFor } from '@/lib/ui/tokens';
import { describeContributor, liveTone, topDriver, type LiveContributor } from '@/lib/live/present';
import { loadGoogleFont } from './font';

const C = {
  bg: '#0B0B0D', panel: '#17171B', fg: '#F5F3EE', muted: '#A5A29B', dim: '#55534F',
  hot: '#FF5A36', warm: '#FFA62B', calm: '#3DDC97', mid: '#D9D3C7',
};

export type CardFormat = 'story' | 'square' | 'og';

export async function renderCountryCard(rawCode: string, format: CardFormat): Promise<Response> {
  const code = rawCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return new Response('Invalid country code', { status: 400 });
  const story = format === 'story';
  const og = format === 'og';
  const W = og ? 1200 : 1080, H = story ? 1920 : og ? 630 : 1080;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('Unavailable', { status: 503 });
  const sb = createClient(url, key);
  const [cRes, allRes, liveRes, black, bold] = await Promise.all([
    sb.from('countries').select('name, flag_emoji').eq('code', code).maybeSingle(),
    sb.from('v_country_latest_composite').select('country_code, score_value'),
    sb.from('v_country_latest_live').select('live_score, live_score_7d, contributors').eq('country_code', code).maybeSingle(),
    loadGoogleFont('Inter', 900),
    loadGoogleFont('Inter', 600),
  ]);
  if (!cRes.data) return new Response('Not found', { status: 404 });
  const name = cRes.data.name as string;
  const flag = (cRes.data.flag_emoji as string | null) ?? '';
  const all = ((allRes.data ?? []) as { country_code: string; score_value: number }[])
    .map(r => ({ cc: r.country_code, v: Number(r.score_value) })).sort((a, b) => b.v - a.v);
  const n = all.length;
  const rank = all.findIndex(r => r.cc === code) + 1;
  const composite = all.find(r => r.cc === code)?.v ?? null;
  const band = bandFor(composite);

  // Headline: rank from the stressed end for the upper half, from the calm end otherwise.
  const stressedSide = rank > 0 && rank <= Math.ceil(n / 2);
  const shownRank = stressedSide ? rank : n - rank + 1;
  // Colour carries meaning: hot/warm for the stressed end, green only for the 5 calmest, neutral in between.
  const accent = stressedSide
    ? (rank <= 3 ? C.hot : rank <= 8 ? C.warm : C.mid)
    : (shownRank <= 5 ? C.calm : C.mid);
  const headline = stressedSide ? 'MOST STRESSED' : 'LEAST STRESSED';


  const live = liveRes.data as { live_score: number; live_score_7d: number | null; contributors: LiveContributor[] } | null;
  const liveScore = live ? Number(live.live_score_7d ?? live.live_score) : null;
  const tone = liveTone(liveScore);
  const driver = live ? topDriver(live.contributors) : null;
  const alert = tone === 'high' || tone === 'rising'
    ? { label: '▲ PRESSURE RISING', color: C.hot }
    : tone === 'easing' ? { label: '▼ PRESSURE EASING', color: C.calm } : { label: '● HOLDING STEADY', color: C.muted };

  const month = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
  const fonts = [
    ...(black ? [{ name: 'Inter', data: black, weight: 900 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'Inter', data: bold, weight: 600 as const, style: 'normal' as const }] : []),
  ];
  const pad = story ? 84 : 72;

  // Ranking strip: one bar per country, most stressed on the left.
  const strip = (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 80 : 34 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: story ? 170 : 90 }}>
        {all.map(r => {
          const me = r.cc === code;
          const h = Math.max(10, ((r.v - all[n - 1].v) / Math.max(1, all[0].v - all[n - 1].v)) * (story ? 170 : 90));
          return <div key={r.cc} style={{ display: 'flex', flex: 1, height: h, borderRadius: 6, background: me ? accent : C.dim }} />;
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 24, color: C.muted, letterSpacing: 2 }}>
        <div style={{ display: 'flex' }}>MOST STRESSED</div>
        <div style={{ display: 'flex' }}>{`${n} COUNTRIES`}</div>
        <div style={{ display: 'flex' }}>LEAST</div>
      </div>
    </div>
  );

  const glow = <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', backgroundImage: `radial-gradient(circle at 85% 12%, ${accent}40 0%, ${accent}00 55%)` }} />;
  const opts = { width: W, height: H, fonts: fonts.length ? fonts : undefined, headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } };

  if (og) {
    const bars = (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 110 }}>
        {all.map(r => {
          const h = Math.max(8, ((r.v - all[n - 1].v) / Math.max(1, all[0].v - all[n - 1].v)) * 110);
          return <div key={r.cc} style={{ display: 'flex', flex: 1, height: h, borderRadius: 4, background: r.cc === code ? accent : C.dim }} />;
        })}
      </div>
    );
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, padding: '48px 60px', fontFamily: 'Inter' }}>
          {glow}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, color: C.muted, letterSpacing: 3, fontWeight: 600 }}>
            <div style={{ display: 'flex' }}>THE HUMAN INDEX</div>
            <div style={{ display: 'flex' }}>{`STRESS RANKING · ${month}`}</div>
          </div>
          <div style={{ display: 'flex', flex: 1, gap: 48, marginTop: 26 }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: 520 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ display: 'flex', fontSize: 60 }}>{flag}</div>
                <div style={{ display: 'flex', fontSize: name.length > 12 ? 48 : 60, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{name.toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', fontSize: 230, fontWeight: 900, color: accent, letterSpacing: -10, lineHeight: 0.9, marginTop: 10 }}>{`#${shownRank}`}</div>
              <div style={{ display: 'flex', fontSize: 46, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>{headline}</div>
              <div style={{ display: 'flex', fontSize: 24, color: C.muted, marginTop: 8, fontWeight: 600 }}>{`out of ${n} countries tracked`}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
              {bars}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 16, color: C.muted, letterSpacing: 2 }}>
                <div style={{ display: 'flex' }}>MOST STRESSED</div>
                <div style={{ display: 'flex' }}>LEAST</div>
              </div>
              {liveScore !== null && driver && (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28, background: C.panel, borderRadius: 20, padding: '22px 26px', borderLeft: `8px solid ${alert.color}` }}>
                  <div style={{ display: 'flex', fontSize: 20, fontWeight: 900, color: alert.color, letterSpacing: 2 }}>{alert.label}</div>
                  <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, marginTop: 8, lineHeight: 1.2 }}>{describeContributor(driver)}</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 900 }}>Where does your country rank?</div>
            <div style={{ display: 'flex', fontSize: 28, color: accent, fontWeight: 900 }}>thehumanindex.org</div>
          </div>
        </div>
      ),
      opts,
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, padding: pad, fontFamily: 'Inter' }}>
        {glow}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, color: C.muted, letterSpacing: 3, fontWeight: 600 }}>
          <div style={{ display: 'flex' }}>THE HUMAN INDEX</div>
          <div style={{ display: 'flex' }}>{`STRESS RANKING · ${month}`}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: story ? 110 : 48 }}>
          <div style={{ display: 'flex', fontSize: story ? 110 : 84 }}>{flag}</div>
          <div style={{ display: 'flex', fontSize: story ? 104 : 84, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{name.toUpperCase()}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: story ? 'column' : 'row', alignItems: story ? 'flex-start' : 'flex-end', gap: story ? 0 : 34, marginTop: story ? 50 : 18 }}>
          <div style={{ display: 'flex', fontSize: story ? 440 : 260, fontWeight: 900, color: accent, letterSpacing: -14, lineHeight: 0.9 }}>{`#${shownRank}`}</div>
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: story ? 0 : 20, marginTop: story ? 10 : 0 }}>
            <div style={{ display: 'flex', fontSize: story ? 92 : 52, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{headline}</div>
            <div style={{ display: 'flex', fontSize: story ? 42 : 30, color: C.muted, marginTop: 12, fontWeight: 600 }}>{`out of ${n} countries tracked`}</div>
          </div>
        </div>

        {strip}

        {liveScore !== null && driver && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 70 : 34, background: C.panel, borderRadius: 28, padding: story ? '40px 44px' : '28px 34px', borderLeft: `10px solid ${alert.color}` }}>
            <div style={{ display: 'flex', fontSize: story ? 34 : 28, fontWeight: 900, color: alert.color, letterSpacing: 2 }}>{alert.label}</div>
            <div style={{ display: 'flex', fontSize: story ? 50 : 38, fontWeight: 600, marginTop: 12, lineHeight: 1.2 }}>{describeContributor(driver)}</div>
          </div>
        )}


        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ display: 'flex', fontSize: story ? 58 : 44, fontWeight: 900, letterSpacing: -1 }}>Where does your country rank?</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14 }}>
            <div style={{ display: 'flex', fontSize: story ? 40 : 34, color: accent, fontWeight: 900 }}>thehumanindex.org</div>
            <div style={{ display: 'flex', fontSize: 22, color: C.dim }}>{composite !== null && band ? `Composite ${composite.toFixed(1)}/100 · 29 indicators` : '29 indicators'}</div>
          </div>
        </div>
      </div>
    ),
    opts,
  );
}
