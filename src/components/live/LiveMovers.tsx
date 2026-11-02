import Link from 'next/link';
import {
  describeContributor,
  liveTone,
  LIVE_TONE_LABEL,
  LIVE_TONE_TEXT_CLASS,
  topDriver,
  type LiveCountry,
} from '@/lib/live/present';

interface Props {
  rows: Array<LiveCountry & { name: string; flag_emoji: string | null }>;
  /** ISO date of the newest upstream observation (data as of). */
  newestData: string | null;
}

/**
 * "What's moving now" — countries ranked by 7-day Live score.
 * Live = momentum vs each country's own history; 50 = a normal period.
 */
export function LiveMovers({ rows, newestData }: Props) {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => (b.live_score_7d ?? b.live_score) - (a.live_score_7d ?? a.live_score));
  const rising = sorted.slice(0, 5);
  const easing = sorted.slice(-3).reverse();
  const computed = rows.reduce((acc, r) => (r.computed_at > acc ? r.computed_at : acc), rows[0].computed_at);

  return (
    <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-border">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted font-medium mb-3">Live layer</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">What&apos;s moving now.</h2>
        <p className="text-foreground-muted text-pretty">
          The composite moves slowly — it is built on annual data. The Live layer tracks what changed
          recently: unemployment, inflation, currency, job postings and disasters, each compared with the
          country&apos;s own history. 50 means a normal period.
        </p>
        <p className="mt-3 text-xs text-foreground-subtle tabular-nums">
          Signals checked {new Date(computed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
          {newestData && <> · newest data {new Date(newestData).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</>}
          {' · '}
          <Link href="/methodology#live-layer" className="underline decoration-foreground-subtle/40 underline-offset-2 hover:text-foreground">
            how it works
          </Link>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <MoversList title="Rising pressure" rows={rising} />
        <MoversList title="Easing" rows={easing} />
      </div>
    </section>
  );
}

function MoversList({ title, rows }: { title: string; rows: Props['rows'] }) {
  return (
    <div>
      <h3 className="text-sm font-medium uppercase tracking-wider text-foreground-muted mb-4">{title}</h3>
      <ol className="divide-y divide-border border-y border-border">
        {rows.map(r => {
          const score = r.live_score_7d ?? r.live_score;
          const tone = liveTone(score);
          const driver = topDriver(r.contributors);
          return (
            <li key={r.country_code}>
              <Link
                href={`/country/${r.country_code.toLowerCase()}#live`}
                className="flex items-center gap-4 py-3 hover:bg-background-alt/60 transition-colors px-1"
              >
                <span className="text-xl w-7 text-center" aria-hidden="true">{r.flag_emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium truncate">{r.name}</span>
                  {driver && (
                    <span className="block text-sm text-foreground-muted truncate">{describeContributor(driver)}</span>
                  )}
                </span>
                <span className="text-right shrink-0">
                  <span className={`block font-mono tabular-nums text-lg font-semibold ${tone ? LIVE_TONE_TEXT_CLASS[tone] : ''}`}>
                    {score.toFixed(0)}
                  </span>
                  {tone && <span className="block text-[11px] uppercase tracking-wider text-foreground-subtle">{LIVE_TONE_LABEL[tone]}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
