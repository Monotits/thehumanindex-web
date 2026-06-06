import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { getActiveLocale } from '@/lib/ui/locale';

// Locale-aware: dynamic so we re-render per NEXT_LOCALE cookie.
export const dynamic = 'force-dynamic';

interface PulseRow {
  id: string;
  slug: string;
  country_code: string;
  locale: string;
  title: string;
  excerpt: string | null;
  published_at: string;
}

interface CountryRow {
  code: string;
  name: string;
  flag_emoji: string | null;
}

async function loadPulses(locale: string): Promise<{
  pulses: PulseRow[];
  countryNames: Map<string, CountryRow>;
  fallbackUsed: boolean;
}> {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { pulses: [], countryNames: new Map(), fallbackUsed: false };
  }

  const sb = createClient(sbUrl, sbKey);

  // Try requested locale; fall back to English if empty
  let pulsesRes = await sb
    .from('commentary')
    .select('id, slug, country_code, locale, title, excerpt, published_at')
    .eq('type', 'weekly_pulse')
    .eq('locale', locale)
    .order('published_at', { ascending: false })
    .limit(40);

  let fallbackUsed = false;
  if (!pulsesRes.data || pulsesRes.data.length === 0) {
    if (locale !== 'en') {
      fallbackUsed = true;
      pulsesRes = await sb
        .from('commentary')
        .select('id, slug, country_code, locale, title, excerpt, published_at')
        .eq('type', 'weekly_pulse')
        .eq('locale', 'en')
        .order('published_at', { ascending: false })
        .limit(40);
    }
  }

  const countriesRes = await sb
    .from('countries')
    .select('code, name, flag_emoji')
    .eq('active', true);

  const pulses = (pulsesRes.data ?? []) as PulseRow[];
  const countryNames = new Map<string, CountryRow>(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      r as CountryRow,
    ]),
  );

  return { pulses, countryNames, fallbackUsed };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function PulsePage() {
  const locale = await getActiveLocale();
  const { pulses, countryNames, fallbackUsed } = await loadPulses(locale);

  // Group: featured (latest 2) + monthly buckets
  const featured = pulses.slice(0, 2);
  const rest = pulses.slice(2);

  // Bucket by year-month
  const buckets = new Map<string, PulseRow[]>();
  for (const p of rest) {
    const ym = p.published_at.slice(0, 7); // YYYY-MM
    if (!buckets.has(ym)) buckets.set(ym, []);
    buckets.get(ym)!.push(p);
  }
  const monthKeys = Array.from(buckets.keys()).sort().reverse();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Pulse
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Weekly editorial on civilizational stress.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Short, sourced briefings on what the indicators are doing and why
              it matters. Per country, per week.
            </p>
            {fallbackUsed && (
              <p className="mt-4 text-xs text-foreground-subtle">
                Weekly Pulse is not yet translated for the selected language —
                showing the English edition.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      {featured.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-2 gap-6">
            {featured.map((p) => (
              <FeaturedPulse
                key={p.id}
                pulse={p}
                country={countryNames.get(p.country_code)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── ARCHIVE BY MONTH ── */}
      {monthKeys.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-8">
            Archive
          </h2>
          <div className="space-y-12">
            {monthKeys.map((ym) => {
              const items = buckets.get(ym)!;
              const label = new Date(`${ym}-01`).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <div key={ym}>
                  <h3 className="text-xs uppercase tracking-wider text-foreground-subtle mb-4 font-medium">
                    {label}
                  </h3>
                  <ul className="divide-y divide-border border-y border-border">
                    {items.map((p) => (
                      <PulseRowItem
                        key={p.id}
                        pulse={p}
                        country={countryNames.get(p.country_code)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {pulses.length === 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-foreground-muted">
            No Pulse articles published yet. Check back soon.
          </p>
        </section>
      )}
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────

function FeaturedPulse({
  pulse,
  country,
}: {
  pulse: PulseRow;
  country: CountryRow | undefined;
}) {
  return (
    <Link
      href={`/pulse/${pulse.slug}`}
      className="group block rounded-lg border border-border bg-background-alt/30 hover:bg-background-alt p-7 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-foreground-subtle mb-3">
        {country ? (
          <>
            <span className="text-base" aria-hidden="true">
              {country.flag_emoji ?? '🌐'}
            </span>
            <span>{country.name}</span>
          </>
        ) : pulse.country_code === 'global' ? (
          <>
            <span className="text-base" aria-hidden="true">
              🌐
            </span>
            <span>Global</span>
          </>
        ) : (
          <span>{pulse.country_code}</span>
        )}
        <span aria-hidden="true">·</span>
        <time dateTime={pulse.published_at} className="tabular-nums">
          {formatDate(pulse.published_at)}
        </time>
      </div>
      <h3 className="font-serif text-2xl font-semibold leading-snug mb-3 text-balance group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
        {pulse.title}
      </h3>
      {pulse.excerpt && (
        <p className="text-foreground-muted text-base line-clamp-3 text-pretty">
          {pulse.excerpt}
        </p>
      )}
    </Link>
  );
}

function PulseRowItem({
  pulse,
  country,
}: {
  pulse: PulseRow;
  country: CountryRow | undefined;
}) {
  return (
    <li>
      <Link
        href={`/pulse/${pulse.slug}`}
        className="flex items-start sm:items-center gap-4 py-4 hover:bg-background-alt/40 -mx-4 px-4 rounded transition-colors group"
      >
        <span className="text-lg shrink-0 mt-0.5 sm:mt-0" aria-hidden="true">
          {country?.flag_emoji ?? (pulse.country_code === 'global' ? '🌐' : '🏳️')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-foreground-subtle uppercase tracking-wider mb-1">
            <span>
              {country?.name ?? (pulse.country_code === 'global' ? 'Global' : pulse.country_code)}
            </span>
          </div>
          <h4 className="font-serif text-lg leading-snug font-medium group-hover:underline decoration-foreground-subtle/40 underline-offset-2">
            {pulse.title}
          </h4>
        </div>
        <time
          dateTime={pulse.published_at}
          className="text-xs text-foreground-subtle tabular-nums shrink-0 mt-1 sm:mt-0"
        >
          {formatDate(pulse.published_at)}
        </time>
      </Link>
    </li>
  );
}
