import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { MetaCategoryBadge } from '@/components/ui/MetaCategoryBadge';
import { SourceAttribution } from '@/components/ui/SourceAttribution';
import { cn } from '@/lib/ui/cn';

export const dynamic = 'force-dynamic';

interface LayoffRow {
  id: string;
  company: string;
  people_affected: number | null;
  workforce_percent: number | null;
  industry: string | null;
  country_code: string | null;
  reasons: string[] | null;
  is_ai_driven: boolean;
  announcement_date: string;
  source_name: string;
  source_url: string;
  headline: string;
  confidence_tier: 'verified' | 'reported' | 'rumored';
}

interface CountryRow {
  code: string;
  name: string;
  flag_emoji: string | null;
}

async function loadData() {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    return { layoffs: [] as LayoffRow[], countries: new Map<string, CountryRow>() };
  }
  const sb = createClient(sbUrl, sbKey);

  const [layoffsRes, countriesRes] = await Promise.all([
    sb
      .from('corporate_layoffs_curated')
      .select(
        'id, company, people_affected, workforce_percent, industry, country_code, reasons, is_ai_driven, announcement_date, source_name, source_url, headline, confidence_tier',
      )
      .order('announcement_date', { ascending: false })
      .limit(80),
    sb.from('countries').select('code, name, flag_emoji').eq('active', true),
  ]);

  const layoffs = (layoffsRes.data ?? []) as LayoffRow[];
  const countries = new Map<string, CountryRow>(
    (countriesRes.data ?? []).map((r) => [
      (r as { code: string }).code,
      r as CountryRow,
    ]),
  );

  return { layoffs, countries };
}

function formatAffected(n: number | null): string {
  if (n === null || n === 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toLocaleString();
}

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function reasonLabel(r: string): string {
  return r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function weekBucketKey(iso: string): string {
  // ISO week start (Monday)
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function weekLabel(iso: string): string {
  const start = new Date(iso);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const ys = start.getUTCFullYear();
  const ye = end.getUTCFullYear();
  if (ys === ye) {
    return `${start.toLocaleDateString('en-US', opt)} – ${end.toLocaleDateString('en-US', opt)}, ${ys}`;
  }
  return `${start.toLocaleDateString('en-US', opt)}, ${ys} – ${end.toLocaleDateString('en-US', opt)}, ${ye}`;
}

export default async function LayoffsPage() {
  const { layoffs, countries } = await loadData();

  // Stats — 30 day window
  const now = Date.now();
  const last30 = layoffs.filter(
    (l) => now - new Date(l.announcement_date).getTime() < 30 * 24 * 60 * 60 * 1000,
  );
  const totalAffected30 = last30.reduce((s, l) => s + (l.people_affected ?? 0), 0);
  const aiDriven30 = last30.filter((l) => l.is_ai_driven).length;
  const aiPct = last30.length > 0 ? Math.round((aiDriven30 / last30.length) * 100) : 0;

  const industryTotals = new Map<string, number>();
  for (const l of last30) {
    const k = l.industry ?? 'Other';
    industryTotals.set(k, (industryTotals.get(k) ?? 0) + (l.people_affected ?? 0));
  }
  const topIndustries = Array.from(industryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Group by week
  const weekBuckets = new Map<string, LayoffRow[]>();
  for (const l of layoffs) {
    const k = weekBucketKey(l.announcement_date);
    if (!weekBuckets.has(k)) weekBuckets.set(k, []);
    weekBuckets.get(k)!.push(l);
  }
  const weekKeys = Array.from(weekBuckets.keys()).sort().reverse();

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider text-foreground-muted font-medium">
                Live labor stress signals
              </span>
              <span className="text-foreground-subtle" aria-hidden="true">·</span>
              <MetaCategoryBadge meta="economic" variant="dot" size="sm" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Where the labor market is breaking.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Real-time corporate layoff announcements aggregated from SEC EDGAR
              filings, WARN Act notices, and verified news. Together these
              signals feed the <strong className="text-foreground">Economic meta-index</strong>,
              one of the five dimensions of our composite civilizational stress score.
            </p>
            <p className="mt-3 text-xs text-foreground-subtle">
              Source data is English-only (US/EU regulatory filings). Per-country
              context is available on{' '}
              <Link href="/countries" className="underline underline-offset-2 hover:text-foreground">
                each country page
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI STRIP ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Last 30 days"
            value={formatAffected(totalAffected30)}
            caption="people affected"
          />
          <KpiCard
            label="Events"
            value={`${last30.length}`}
            caption="layoff announcements"
          />
          <KpiCard
            label="AI-driven"
            value={`${aiPct}%`}
            caption="of recent events"
          />
          <KpiCard
            label="Top industry"
            value={topIndustries[0]?.[0] ?? '—'}
            caption={
              topIndustries[0] ? `${formatAffected(topIndustries[0][1])} affected` : 'no data'
            }
          />
        </div>

        {topIndustries.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium mb-3">
              Most affected sectors (30d)
            </h2>
            <div className="flex flex-wrap gap-2">
              {topIndustries.map(([name, count]) => (
                <span
                  key={name}
                  className="inline-flex items-baseline gap-2 rounded-full bg-background-alt border border-border px-3 py-1 text-xs"
                >
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="font-mono tabular-nums text-foreground-muted">
                    {formatAffected(count)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── TIMELINE ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Timeline
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-10">
          Grouped by week. Each row is one announcement — click the source to
          read the underlying report.
        </p>

        {weekKeys.length === 0 ? (
          <p className="text-foreground-muted text-center py-20">
            No layoff data available right now.
          </p>
        ) : (
          <div className="space-y-12">
            {weekKeys.map((wk) => {
              const items = weekBuckets.get(wk)!;
              const weekTotal = items.reduce((s, l) => s + (l.people_affected ?? 0), 0);
              return (
                <div key={wk}>
                  <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xs uppercase tracking-wider text-foreground-subtle font-medium">
                      {weekLabel(wk)}
                    </h3>
                    <span className="text-xs text-foreground-muted tabular-nums">
                      {items.length} event{items.length !== 1 ? 's' : ''} ·{' '}
                      <span className="font-mono font-medium text-foreground">
                        {formatAffected(weekTotal)}
                      </span>{' '}
                      affected
                    </span>
                  </div>
                  <ul className="divide-y divide-border border-y border-border">
                    {items.map((l) => (
                      <LayoffRowItem
                        key={l.id}
                        layoff={l}
                        country={countries.get((l.country_code ?? 'US').toUpperCase())}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── TRUST FOOTER ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <h3 className="font-serif text-lg font-semibold mb-2">
                How this feeds the Economic meta-index
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Verified layoff announcements (SEC EDGAR + WARN Act filings)
                contribute to the <em>automation_exposure</em> and{' '}
                <em>labor_disruption</em> indicators on a per-country basis.
                Rumored/news-only events are tracked separately and do not
                affect the score.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/methodology"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Methodology
              </Link>
              <Link
                href="/data-sources"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Source health
              </Link>
              <Link
                href="/transparency"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Transparency
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="text-xs uppercase tracking-wider text-foreground-subtle mb-2">
        {label}
      </div>
      <div className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold mb-1">
        {value}
      </div>
      <div className="text-xs text-foreground-muted">{caption}</div>
    </div>
  );
}

function LayoffRowItem({
  layoff,
  country,
}: {
  layoff: LayoffRow;
  country: CountryRow | undefined;
}) {
  const cc = (layoff.country_code ?? 'US').toUpperCase();
  return (
    <li className="py-4 flex items-start gap-4 flex-wrap sm:flex-nowrap">
      {/* Flag → country detail */}
      <Link
        href={`/country/${cc.toLowerCase()}`}
        className="shrink-0 mt-0.5 text-xl hover:opacity-80 transition-opacity"
        aria-label={country?.name ?? cc}
        title={country?.name ?? cc}
      >
        {country?.flag_emoji ?? '🌐'}
      </Link>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-serif text-lg font-semibold leading-snug">
            {layoff.company}
          </h4>
          {layoff.industry && (
            <span className="text-xs text-foreground-subtle uppercase tracking-wide">
              {layoff.industry}
            </span>
          )}
          {layoff.confidence_tier === 'rumored' && (
            <span className="text-[10px] uppercase tracking-wide font-medium text-foreground-muted px-1.5 py-0.5 rounded border border-border">
              rumored
            </span>
          )}
        </div>
        {layoff.headline && (
          <p className="text-sm text-foreground-muted mt-1 line-clamp-2 leading-relaxed">
            {layoff.headline}
          </p>
        )}

        {/* Reason chips + source */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {(layoff.reasons ?? []).slice(0, 3).map((r) => (
            <span
              key={r}
              className={cn(
                'inline-flex items-center text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded',
                r === 'AI_DRIVEN'
                  ? 'bg-band-elevated-bg text-band-elevated'
                  : 'text-foreground-muted bg-background-alt',
              )}
            >
              {reasonLabel(r)}
            </span>
          ))}
          <SourceAttribution
            source={layoff.source_name}
            href={layoff.source_url}
            referenceDate={layoff.announcement_date}
            variant="inline"
          />
        </div>
      </div>

      {/* Numbers */}
      <div className="flex items-baseline gap-4 sm:ml-auto sm:text-right shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">
            Affected
          </div>
          <div className="font-mono tabular-nums text-lg font-semibold whitespace-nowrap">
            {formatAffected(layoff.people_affected)}
          </div>
        </div>
        {layoff.workforce_percent !== null && layoff.workforce_percent > 0 && (
          <>
            <div className="border-l border-border h-8 self-center" aria-hidden="true" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">
                % of staff
              </div>
              <div className="font-mono tabular-nums text-base text-foreground-muted whitespace-nowrap">
                {layoff.workforce_percent.toFixed(1)}%
              </div>
            </div>
          </>
        )}
        <div className="border-l border-border h-8 self-center" aria-hidden="true" />
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-subtle">
            Date
          </div>
          <div className="text-xs text-foreground-muted whitespace-nowrap tabular-nums">
            {formatLongDate(layoff.announcement_date)}
          </div>
        </div>
      </div>
    </li>
  );
}
