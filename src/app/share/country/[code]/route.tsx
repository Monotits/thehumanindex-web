/**
 * GET /share/country/{iso2}?format=story|square → PNG share card.
 * story = 1080×1920 (Instagram/TikTok stories), square = 1080×1080 (feeds).
 * Same rendering stack as the OG image (next/og), so no client-side capture.
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { bandFor, BAND_LABELS, META_INDEXES, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { describeContributor, liveTone, LIVE_TONE_LABEL, topDriver, type LiveContributor } from '@/lib/live/present';

export const runtime = 'edge';

const P = {
  bg: '#FAFAF8', fg: '#1A1A1A', muted: '#595956', subtle: '#8A8A85', border: '#E0E0DC',
  low: '#6B8E5A', moderate: '#D6A35C', elevated: '#C97447', high: '#A53E3E', critical: '#5D1F1F',
};
const META_COLOR: Record<MetaIndex, string> = {
  economic: '#475569', social: '#4F46E5', mental: '#7C3AED', technological: '#0891B2', environmental: '#059669',
};
const toneColor = (t: ReturnType<typeof liveTone>) => (t === 'high' ? P.high : t === 'rising' ? P.elevated : t === 'easing' ? P.low : P.muted);

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return new Response('Invalid country code', { status: 400 });
  const story = new URL(req.url).searchParams.get('format') !== 'square';
  const W = 1080, H = story ? 1920 : 1080;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response('Unavailable', { status: 503 });
  const sb = createClient(url, key);
  const [cRes, allRes, metaRes, liveRes] = await Promise.all([
    sb.from('countries').select('name, flag_emoji').eq('code', code).maybeSingle(),
    sb.from('v_country_latest_composite').select('country_code, score_value'),
    sb.from('v_country_latest_meta_indexes').select('meta_index, value').eq('country_code', code),
    sb.from('v_country_latest_live').select('live_score, live_score_7d, contributors, snapshot_date').eq('country_code', code).maybeSingle(),
  ]);
  if (!cRes.data) return new Response('Not found', { status: 404 });
  const name = cRes.data.name as string;
  const flag = (cRes.data.flag_emoji as string | null) ?? '';
  const all = ((allRes.data ?? []) as { country_code: string; score_value: number }[]).map(r => ({ cc: r.country_code, v: Number(r.score_value) })).sort((a, b) => b.v - a.v);
  const rank = all.findIndex(r => r.cc === code) + 1;
  const composite = all.find(r => r.cc === code)?.v ?? null;
  const band = bandFor(composite);
  const bandCol = band ? P[band] : P.subtle;
  const meta: Partial<Record<MetaIndex, number>> = {};
  for (const r of (metaRes.data ?? []) as { meta_index: MetaIndex; value: number | null }[]) if (r.value !== null) meta[r.meta_index] = Number(r.value);
  const live = liveRes.data as { live_score: number; live_score_7d: number | null; contributors: LiveContributor[]; snapshot_date: string } | null;
  const liveScore = live ? Number(live.live_score_7d ?? live.live_score) : null;
  const tone = liveTone(liveScore);
  const driver = live ? topDriver(live.contributors) : null;
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const big = story ? 300 : 220;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: P.bg, color: P.fg, padding: story ? '110px 90px' : '72px 80px', fontFamily: 'sans-serif' }}>
        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: P.fg, color: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'serif' }}>H</div>
          <div style={{ fontSize: 30, fontWeight: 600, fontFamily: 'serif' }}>The Human Index</div>
        </div>

        {/* country */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 140 : 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ fontSize: story ? 120 : 96 }}>{flag}</div>
            <div style={{ fontSize: story ? 96 : 80, fontWeight: 700, fontFamily: 'serif', letterSpacing: -2, lineHeight: 1 }}>{name}</div>
          </div>
          <div style={{ fontSize: 28, color: P.muted, marginTop: 18, letterSpacing: 2, textTransform: 'uppercase' }}>{`Civilizational stress · ${month}`}</div>
        </div>

        {/* composite */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, marginTop: story ? 90 : 36 }}>
          <div style={{ fontSize: big, fontWeight: 700, color: bandCol, lineHeight: 0.9, letterSpacing: -8 }}>{composite === null ? '—' : composite.toFixed(1)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 18 }}>
            {band && <div style={{ display: 'flex', background: bandCol, color: '#fff', fontSize: 30, padding: '8px 22px', borderRadius: 999, letterSpacing: 2, textTransform: 'uppercase' }}>{BAND_LABELS[band]}</div>}
            {rank > 0 && <div style={{ fontSize: 30, color: P.muted }}>{`#${rank} of ${all.length} countries`}</div>}
          </div>
        </div>

        {/* live */}
        {liveScore !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 90 : 36, borderTop: `2px solid ${P.border}`, paddingTop: story ? 50 : 30 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
              <div style={{ fontSize: 28, color: P.muted, letterSpacing: 2, textTransform: 'uppercase' }}>Live pulse</div>
              <div style={{ fontSize: 64, fontWeight: 700, color: toneColor(tone) }}>{liveScore.toFixed(0)}</div>
              {tone && <div style={{ fontSize: 30, color: toneColor(tone) }}>{LIVE_TONE_LABEL[tone]}</div>}
            </div>
            {driver && <div style={{ fontSize: story ? 40 : 34, marginTop: 14, lineHeight: 1.25 }}>{describeContributor(driver)}</div>}
          </div>
        )}

        {/* domains (story only) */}
        {story && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 90 }}>
            {META_INDEXES.filter(m => meta[m] !== undefined).map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 300, fontSize: 30, color: P.muted }}>{META_LABELS[m]}</div>
                <div style={{ display: 'flex', flex: 1, height: 18, background: P.border, borderRadius: 9 }}>
                  <div style={{ width: `${Math.max(2, Math.min(100, meta[m]!))}%`, height: 18, background: META_COLOR[m], borderRadius: 9 }} />
                </div>
                <div style={{ width: 90, fontSize: 32, textAlign: 'right' }}>{meta[m]!.toFixed(0)}</div>
              </div>
            ))}
          </div>
        )}

        {/* footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div style={{ fontSize: story ? 34 : 28, fontWeight: 600 }}>{`thehumanindex.org/country/${code.toLowerCase()}`}</div>
          <div style={{ fontSize: 22, color: P.subtle }}>0–100 · higher = more stress</div>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
