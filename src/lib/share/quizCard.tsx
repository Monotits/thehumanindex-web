/**
 * Quiz result share card. The numbers come from the visitor's own result
 * (passed in the URL); the card says so ("my result") and never presents
 * them as an official country score.
 */

import { ImageResponse } from 'next/og';
import { bandFor, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';
import { C, canvas, cardFonts, cardOptions, Footer, Glow, TopBar, type ShareFormat } from './kit';

const BAND_WORD: Record<string, string> = { low: 'LOW', moderate: 'MODERATE', elevated: 'ELEVATED', high: 'HIGH', critical: 'CRITICAL' };

export async function renderQuizCard(format: ShareFormat, p: { country: { name: string; flag: string }; exposure: number; metas: MetaIndex[] }): Promise<Response> {
  const { story, pad } = canvas(format);
  const fonts = await cardFonts();
  const band = bandFor(p.exposure) ?? 'moderate';
  const accent = band === 'low' ? C.calm : band === 'moderate' ? C.warm : C.hot;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, padding: pad, fontFamily: 'Inter' }}>
        <Glow format={format} color={accent} />
        <TopBar format={format} right="60-SECOND STRESS TEST" />

        <div style={{ display: 'flex', fontSize: story ? 34 : 28, color: accent, fontWeight: 900, letterSpacing: 4, marginTop: story ? 110 : 50 }}>MY STRESS EXPOSURE</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, marginTop: 10 }}>
          <div style={{ display: 'flex', fontSize: story ? 380 : 240, fontWeight: 900, color: accent, letterSpacing: -14, lineHeight: 0.9 }}>{p.exposure.toFixed(0)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: story ? 40 : 24 }}>
            <div style={{ display: 'flex', fontSize: story ? 64 : 48, fontWeight: 900 }}>{BAND_WORD[band]}</div>
            <div style={{ display: 'flex', fontSize: story ? 34 : 28, color: C.muted, fontWeight: 600 }}>out of 100</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: story ? 24 : 10 }}>
          <div style={{ display: 'flex', fontSize: story ? 52 : 40 }}>{p.country.flag}</div>
          <div style={{ display: 'flex', fontSize: story ? 40 : 32, fontWeight: 900, color: C.mid }}>{`living in ${p.country.name}`}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 90 : 36, background: C.panel, borderRadius: 28, padding: story ? '36px 44px' : '24px 32px' }}>
          <div style={{ display: 'flex', fontSize: story ? 28 : 22, color: C.muted, fontWeight: 900, letterSpacing: 3 }}>WHAT PRESSES ON ME MOST</div>
          {p.metas.slice(0, 3).map((m, i) => (
            <div key={m} style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: story ? 22 : 12 }}>
              <div style={{ display: 'flex', fontSize: story ? 52 : 40, fontWeight: 900, color: i === 0 ? accent : C.mid }}>{`${i + 1}`}</div>
              <div style={{ display: 'flex', fontSize: story ? 52 : 40, fontWeight: 900 }}>{META_LABELS[m]}</div>
            </div>
          ))}
        </div>

        <Footer format={format} hook="What’s yours? Take the test." accent={accent} path="/quiz" note="Personal result · not an official score" />
      </div>
    ),
    cardOptions(format, fonts),
  );
}
