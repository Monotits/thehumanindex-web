import Link from 'next/link';
import {
  describeContributor,
  liveTone,
  LIVE_TONE_LABEL,
  LIVE_TONE_TEXT_CLASS,
  SIGNAL_LABELS,
  type LiveCountry,
} from '@/lib/live/present';

/** Country page: Live score + per-signal breakdown. Renders nothing without data. */
export function LivePanel({ live, countryName }: { live: LiveCountry | null; countryName: string }) {
  if (!live) return null;
  const score = live.live_score_7d ?? live.live_score;
  const tone = liveTone(score);
  const signals = [...live.contributors].sort((a, b) => b.stress_score - a.stress_score);

  return (
    <section id="live" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted font-medium mb-2">Live layer</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold">What&apos;s changing in {countryName}</h2>
          <p className="mt-2 text-sm text-foreground-muted max-w-2xl text-pretty">
            Recent momentum compared with {countryName}&apos;s own history. 50 = a normal period; higher means
            conditions are deteriorating faster than usual. Separate from the composite above, which is built
            on annual data.
          </p>
        </div>
        <div className="text-right">
          <div className={`font-mono tabular-nums text-4xl font-semibold ${tone ? LIVE_TONE_TEXT_CLASS[tone] : ''}`}>
            {score.toFixed(1)}
          </div>
          <div className="text-xs uppercase tracking-wider text-foreground-subtle">
            {tone ? LIVE_TONE_LABEL[tone] : ''} · 7-day average
          </div>
        </div>
      </div>

      <ul className="divide-y divide-border border-y border-border">
        {signals.map(c => {
          const meta = SIGNAL_LABELS[c.signal_id];
          const t = liveTone(c.stress_score);
          return (
            <li key={c.signal_id} className="py-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 sm:col-span-5">
                <div className="font-medium">{meta?.name ?? c.signal_id}</div>
                <div className="text-sm text-foreground-muted">{describeContributor(c)}</div>
              </div>
              <div className="col-span-9 sm:col-span-5">
                <div className="relative h-2 rounded-full bg-background-alt" aria-hidden="true">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-foreground-subtle/50" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-foreground"
                    style={{ left: `${Math.min(100, Math.max(0, c.stress_score))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-foreground-subtle mt-1">
                  <span>easing</span><span>normal</span><span>pressure</span>
                </div>
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <span className={`font-mono tabular-nums font-semibold ${t ? LIVE_TONE_TEXT_CLASS[t] : ''}`}>{c.stress_score.toFixed(0)}</span>
                <div className="text-[11px] text-foreground-subtle">
                  {meta?.source} · {c.signal_id === 'active_disasters' ? 'last 30d' : new Date(c.reference_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-foreground-subtle">
        Updated {new Date(live.computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} ·{' '}
        <Link href="/methodology#live-layer" className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">methodology</Link>
        {' · '}
        <a href={`/api/live/${live.country_code.toLowerCase()}`} className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">JSON</a>
      </p>
    </section>
  );
}
