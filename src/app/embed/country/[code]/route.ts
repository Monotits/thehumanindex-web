/**
 * GET /embed/country/{iso2} — self-contained HTML card for <iframe> embeds.
 * A route handler (not a page) so the site header/footer layout is not
 * rendered. Framing is allowed only on /embed/* (see next.config.mjs).
 */

import { anonClient, loadLatestLive, liveTone, LIVE_TONE_LABEL } from '@/lib/live/present';
import { loadHistorical } from '@/lib/history/present';
import { bandFor, BAND_LABELS } from '@/lib/ui/tokens';

export const revalidate = 86400; // daily: data changes once a day; crons revalidate on demand

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cc = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return new Response('Invalid country code', { status: 400 });
  const theme = new URL(req.url).searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const sb = await anonClient();
  if (!sb) return new Response('Unavailable', { status: 503 });

  const [cRes, compRes, live, hist] = await Promise.all([
    sb.from('countries').select('code, name, flag_emoji').eq('code', cc).eq('active', true).maybeSingle(),
    sb.from('v_country_latest_composite').select('score_value, computed_at').eq('country_code', cc).maybeSingle(),
    loadLatestLive(sb),
    loadHistorical(sb, cc),
  ]);
  if (!cRes.data) return new Response('Not found', { status: 404 });
  const name = cRes.data.name as string;
  const flag = (cRes.data.flag_emoji as string | null) ?? '';
  const composite = compRes.data ? Number(compRes.data.score_value) : null;
  const band = bandFor(composite);
  const l = live.get(cc);
  const lScore = l ? (l.live_score_7d ?? l.live_score) : null;
  const tone = liveTone(lScore);

  // Sparkline of the historical index
  const pts = hist.filter(h => h.composite !== null).map(h => ({ y: h.year, v: h.composite as number }));
  let spark = '';
  if (pts.length >= 5) {
    const W = 220, H = 44, vs = pts.map(p => p.v), lo = Math.min(...vs) - 2, hi = Math.max(...vs) + 2;
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * W).toFixed(1)},${(H - ((p.v - lo) / (hi - lo)) * H).toFixed(1)}`).join(' ');
    spark = `<div class="spark"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><div class="cap">Historical index ${pts[0].y}–${pts[pts.length - 1].y}</div></div>`;
  }

  const page = `https://thehumanindex.org/country/${cc.toLowerCase()}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} — The Human Index</title><meta name="robots" content="noindex">
<style>
:root{--bg:#FAF9F6;--fg:#1F2328;--muted:#5B6168;--border:#E4E1DA;--low:#6B8E5A;--moderate:#D6A35C;--elevated:#C97447;--high:#A53E3E;--critical:#5D1F1F}
[data-theme=dark]{--bg:#16181B;--fg:#ECEAE4;--muted:#A3A7AD;--border:#2C2F33;--low:#8FB97F;--moderate:#E5B870;--elevated:#E08D60;--high:#C56565;--critical:#B44B4B}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}.card{border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:100vh}
.top{display:flex;align-items:center;gap:8px;font-weight:600;font-size:15px}.row{display:flex;gap:24px;flex-wrap:wrap}
.k{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.v{font:600 28px/1.1 ui-monospace,SFMono-Regular,Menlo,monospace}
.t{font-size:12px;color:var(--muted)}.spark{color:var(--muted)}.cap{font-size:11px;color:var(--muted)}
.foot{margin-top:auto;font-size:11px;color:var(--muted);display:flex;justify-content:space-between;gap:8px}
</style></head><body data-theme="${theme}"><div class="card">
<div class="top"><span aria-hidden="true">${esc(flag)}</span><a href="${page}" target="_blank" rel="noopener">${esc(name)}</a></div>
<div class="row">
<div><div class="k">Stress composite</div><div class="v" style="color:${band ? `var(--${band})` : 'inherit'}">${composite === null ? '—' : composite.toFixed(1)}</div><div class="t">${band ? BAND_LABELS[band] : ''} · 0–100</div></div>
${lScore !== null ? `<div><div class="k">Live pulse</div><div class="v">${lScore.toFixed(1)}</div><div class="t">${tone ? LIVE_TONE_LABEL[tone] : ''} · 50 = normal</div></div>` : ''}
</div>
${spark}
<div class="foot"><a href="${page}" target="_blank" rel="noopener">thehumanindex.org</a><span>CC BY-NC 4.0</span></div>
</div></body></html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Security-Policy': "frame-ancestors *",
    },
  });
}
