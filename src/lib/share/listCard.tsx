/**
 * Ranked-list share card: "THE 10 MOST STRESSED COUNTRIES", indicator
 * rankings, Live "pressure rising" lists. Story shows up to 10 rows,
 * square up to 5.
 */

import { ImageResponse } from 'next/og';
import { C, canvas, cardFonts, cardOptions, Footer, Glow, TopBar, type ShareFormat } from './kit';

export interface ListRow { flag: string; name: string; value: string; sub?: string }

export interface ListCardSpec {
  format: ShareFormat;
  topRight: string;          // e.g. "STRESS RANKING · NOV 2026"
  kicker: string;            // small accent label above the title
  title: string;             // the claim, in caps
  rows: ListRow[];
  tone: 'hot' | 'calm';      // hot = stressed end, calm = least stressed / easing
  hook: string;              // bottom call to action
  note?: string;             // tiny source line
  path?: string;             // URL path shown after the domain
}

export async function renderListCard(s: ListCardSpec): Promise<Response> {
  const { story, pad } = canvas(s.format);
  const fonts = await cardFonts();
  const accent = s.tone === 'hot' ? C.hot : C.calm;
  const rows = s.rows.slice(0, story ? 10 : 5);
  const hasSub = rows.some(r => r.sub);
  const rowH = story ? (hasSub ? 112 : 98) : (hasSub ? 104 : 92);
  const titleSize = s.title.length > 34 ? (story ? 78 : 62) : (story ? 96 : 76);
  const rowColor = (i: number) => (s.tone === 'hot' ? (i < 3 ? C.hot : i < 6 ? C.warm : C.mid) : (i < 3 ? C.calm : C.mid));

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.bg, color: C.fg, padding: pad, fontFamily: 'Inter' }}>
        <Glow format={s.format} color={accent} />
        <TopBar format={s.format} right={s.topRight} />

        <div style={{ display: 'flex', fontSize: story ? 32 : 26, color: accent, fontWeight: 900, letterSpacing: 4, marginTop: story ? 90 : 44 }}>{s.kicker}</div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 900, letterSpacing: -3, lineHeight: 1, marginTop: 14 }}>{s.title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: story ? 60 : 34 }}>
          {rows.map((r, i) => (
            <div key={`${r.name}-${i}`} style={{ display: 'flex', alignItems: 'center', height: rowH, borderBottom: `2px solid ${C.panel}` }}>
              <div style={{ display: 'flex', width: story ? 90 : 76, fontSize: story ? 50 : 42, fontWeight: 900, color: rowColor(i) }}>{`${i + 1}`}</div>
              <div style={{ display: 'flex', fontSize: story ? 54 : 46, width: story ? 84 : 70 }}>{r.flag}</div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', fontSize: story ? 46 : 40, fontWeight: 900, letterSpacing: -1 }}>{r.name}</div>
                {r.sub && <div style={{ display: 'flex', fontSize: story ? 26 : 22, color: C.muted, fontWeight: 600, marginTop: 4 }}>{r.sub}</div>}
              </div>
              <div style={{ display: 'flex', fontSize: story ? 50 : 42, fontWeight: 900, color: rowColor(i) }}>{r.value}</div>
            </div>
          ))}
        </div>

        <Footer format={s.format} hook={s.hook} accent={accent} note={s.note} path={s.path} />
      </div>
    ),
    cardOptions(s.format, fonts),
  );
}
