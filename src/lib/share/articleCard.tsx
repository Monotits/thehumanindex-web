/**
 * Article share card (Weekly Pulse / Research): the headline as a quote,
 * with the country's current published rank and composite underneath.
 */

import { ImageResponse } from 'next/og';
import { C, canvas, cardFonts, cardOptions, Footer, Glow, monthLabel, TopBar, type ShareFormat } from './kit';

export interface ArticleCardSpec {
  format: ShareFormat;
  kind: 'WEEKLY PULSE' | 'RESEARCH';
  title: string;
  country?: { name: string; flag: string; rank: number; total: number; composite: number } | null;
  path: string;
}

export async function renderArticleCard(s: ArticleCardSpec): Promise<Response> {
  const { story, pad } = canvas(s.format);
  const fonts = await cardFonts();
  const c = s.country;
  const stressed = c ? c.rank <= Math.ceil(c.total / 2) : false;
  const shownRank = c ? (stressed ? c.rank : c.total - c.rank + 1) : 0;
  const accent = c ? (stressed ? (c.rank <= 3 ? C.hot : c.rank <= 8 ? C.warm : C.mid) : (shownRank <= 5 ? C.calm : C.mid)) : C.warm;
  const len = s.title.length;
  const titleSize = story ? (len > 90 ? 76 : len > 60 ? 88 : 104) : (len > 90 ? 54 : len > 60 ? 62 : 74);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, padding: pad, fontFamily: 'Inter' }}>
        <Glow format={s.format} color={accent} />
        <TopBar format={s.format} right={`${s.kind} · ${monthLabel()}`} />

        {c && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: story ? 100 : 44 }}>
            <div style={{ display: 'flex', fontSize: story ? 80 : 60 }}>{c.flag}</div>
            <div style={{ display: 'flex', fontSize: story ? 56 : 44, fontWeight: 900, letterSpacing: -1 }}>{c.name.toUpperCase()}</div>
          </div>
        )}

        <div style={{ display: 'flex', fontSize: story ? 200 : 120, fontWeight: 900, color: accent, lineHeight: 0.8, marginTop: story ? 50 : 24, height: story ? 110 : 66 }}>“</div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05 }}>{s.title}</div>

        {c && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: story ? 70 : 34, background: C.panel, borderRadius: 28, padding: story ? '34px 40px' : '24px 30px', borderLeft: `10px solid ${accent}` }}>
            <div style={{ display: 'flex', fontSize: story ? 96 : 72, fontWeight: 900, color: accent, letterSpacing: -4 }}>{`#${shownRank}`}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: story ? 40 : 32, fontWeight: 900 }}>{stressed ? 'MOST STRESSED' : 'LEAST STRESSED'}</div>
              <div style={{ display: 'flex', fontSize: story ? 30 : 24, color: C.muted, fontWeight: 600, marginTop: 6 }}>{`of ${c.total} countries · composite ${c.composite.toFixed(1)}/100`}</div>
            </div>
          </div>
        )}

        <Footer format={s.format} hook={s.kind === 'RESEARCH' ? 'Read the full research' : 'Read this week’s analysis'} accent={accent} path={s.path.length <= 28 ? s.path : undefined} />
      </div>
    ),
    cardOptions(s.format, fonts),
  );
}
