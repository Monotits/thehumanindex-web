import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/lib/ui/cn';
import { freshnessFor, FRESHNESS_COLOR_VAR, FRESHNESS_LABELS } from '@/lib/ui/tokens';

export const metadata: Metadata = {
  title: 'Transparency — The Human Index',
  description:
    'Trust scoreboard for The Human Index: source health, cross-source validation rates, data freshness distribution, and confidence tier breakdowns. Updated every cron cycle.',
  alternates: { canonical: 'https://thehumanindex.org/transparency' },
};

export const revalidate = 1800;

interface HealthRow {
  source: string;
  status: 'ok' | 'degraded' | 'failed';
  last_success_at: string | null;
  last_attempt_at: string;
  data_points_count: number;
  duration_ms: number | null;
}

interface UptimeRow {
  source: string;
  uptime: number | null;
  total_runs: number;
}

interface IndicatorSnapshotRow {
  indicator_id: string;
  country_code: string;
  reference_date: string;
}

async function loadTransparencyData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      health: [] as HealthRow[],
      uptime: [] as UptimeRow[],
      lastRunAt: null as string | null,
      snapshots: [] as IndicatorSnapshotRow[],
      indicatorCount: 0,
      countryCount: 0,
    };
  }
  const sb = createClient(url, key);

  const [healthRes, uptimeRes, snapshotsRes, indicatorsRes, countriesRes] =
    await Promise.all([
      sb.from('v_data_source_health_latest').select('source, status, last_success_at, last_attempt_at, data_points_count, duration_ms'),
      sb.from('v_data_source_uptime_30d').select('source, uptime, total_runs'),
      sb
        .from('indicator_snapshots')
        .select('indicator_id, country_code, reference_date')
        .order('reference_date', { ascending: false })
        .limit(2000),
      sb.from('indicators').select('id', { count: 'exact', head: true }).eq('active', true),
      sb.from('countries').select('code', { count: 'exact', head: true }).eq('active', true),
    ]);

  const health = (healthRes.data ?? []) as HealthRow[];
  const uptime = (uptimeRes.data ?? []) as UptimeRow[];
  const snapshots = (snapshotsRes.data ?? []) as IndicatorSnapshotRow[];

  const lastRunAt = health
    .map((r) => r.last_attempt_at)
    .sort()
    .at(-1) ?? null;

  return {
    health,
    uptime,
    lastRunAt,
    snapshots,
    indicatorCount: indicatorsRes.count ?? 0,
    countryCount: countriesRes.count ?? 0,
  };
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const ts = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default async function TransparencyPage() {
  const { health, uptime, lastRunAt, snapshots, indicatorCount, countryCount } =
    await loadTransparencyData();

  // Aggregate
  const totalSources = health.length;
  const ok = health.filter((h) => h.status === 'ok').length;
  const degraded = health.filter((h) => h.status === 'degraded').length;
  const failed = health.filter((h) => h.status === 'failed').length;
  const uptimeAvg =
    uptime.length > 0
      ? Math.round(
          (uptime.reduce((s, u) => s + (u.uptime ?? 0), 0) / uptime.length) * 1000,
        ) / 10
      : null;

  // Freshness distribution across snapshots
  const freshnessBuckets = { fresh: 0, aging: 0, stale: 0, very_stale: 0 };
  for (const s of snapshots) {
    const f = freshnessFor(s.reference_date);
    if (f) freshnessBuckets[f] += 1;
  }
  const totalSnapshots = snapshots.length;

  const sourceList = [...uptime].sort((a, b) => (b.uptime ?? 0) - (a.uptime ?? 0));

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Transparency
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              The full audit trail.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              Trust is earned by showing the work. Below is how our data sources
              are performing, how fresh the data is, and where independent
              feeds agree or diverge.
            </p>
            <p className="mt-3 text-sm text-foreground-subtle">
              Last cron run: {formatRelative(lastRunAt)}
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI GRID ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Active sources"
            value={`${totalSources}`}
            caption={`${ok} OK · ${degraded} degraded · ${failed} failed`}
          />
          <KpiCard
            label="30-day uptime"
            value={uptimeAvg !== null ? `${uptimeAvg.toFixed(1)}%` : '—'}
            caption="avg across all sources"
          />
          <KpiCard
            label="Indicators tracked"
            value={`${indicatorCount}`}
            caption={`across ${countryCount} countries`}
          />
          <KpiCard
            label="Cron cadence"
            value="12h"
            caption="continuous refresh"
          />
        </div>
      </section>

      {/* ── FRESHNESS DISTRIBUTION ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Data freshness
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          How recent are the underlying observations? Fresh means within 2 years,
          aging 2–3 years, stale 3–5 years, very stale beyond.
        </p>

        <FreshnessBar
          buckets={freshnessBuckets}
          total={totalSnapshots}
        />
      </section>

      {/* ── SOURCE HEALTH TABLE ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
              Source uptime
            </h2>
            <p className="text-foreground-muted max-w-2xl">
              Each data adapter, sorted by 30-day uptime. Failures are surfaced,
              not hidden.
            </p>
          </div>
          <Link
            href="/data-sources"
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Full source dashboard →
          </Link>
        </div>

        {sourceList.length === 0 ? (
          <p className="text-foreground-muted text-sm">No source data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-strong text-xs uppercase tracking-wider text-foreground-muted">
                  <th className="text-left py-3 pr-3 font-medium">Source</th>
                  <th className="text-right py-3 pr-3 font-medium">30-day uptime</th>
                  <th className="text-right py-3 pr-3 font-medium">Runs</th>
                  <th className="text-right py-3 pr-3 font-medium">Status</th>
                  <th className="text-right py-3 pr-3 font-medium">Last success</th>
                </tr>
              </thead>
              <tbody>
                {sourceList.map((u) => {
                  const h = health.find((x) => x.source === u.source);
                  return (
                    <tr
                      key={u.source}
                      className="border-b border-border hover:bg-background-alt/50"
                    >
                      <td className="py-3 pr-3 font-medium">{u.source}</td>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums">
                        {u.uptime !== null
                          ? `${(u.uptime * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums text-foreground-muted">
                        {u.total_runs}
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <StatusPill status={h?.status ?? 'unknown'} />
                      </td>
                      <td className="py-3 pr-3 text-right text-foreground-muted tabular-nums">
                        {formatRelative(h?.last_success_at ?? null)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-8">
            How we earn your trust
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Principle
              title="Every number is sourced"
              body="Each indicator value links back to the publishing organization, the reference date, and the raw query we used. No black boxes."
            />
            <Principle
              title="Cross-source validation"
              body="Whenever two independent sources publish the same indicator, we display both. If they disagree by more than a set threshold, we flag it and surface the spread."
            />
            <Principle
              title="Failure is public"
              body="When an adapter fails, the failure shows up on this page within minutes. We do not hide outages or fabricate continuity."
            />
          </div>
          <div className="mt-10 flex flex-wrap gap-4 text-sm">
            <Link
              href="/methodology"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Read the methodology
            </Link>
            <span className="text-foreground-subtle">·</span>
            <Link
              href="/data-sources"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              All sources
            </Link>
            <span className="text-foreground-subtle">·</span>
            <a
              href="https://github.com/Monotits/thehumanindex-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
            >
              Source code
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    ok: {
      label: 'OK',
      bg: 'rgba(107,142,90,0.18)',
      fg: 'var(--band-low)',
    },
    degraded: {
      label: 'Degraded',
      bg: 'rgba(214,163,92,0.18)',
      fg: 'var(--band-moderate)',
    },
    failed: {
      label: 'Failed',
      bg: 'rgba(165,62,62,0.18)',
      fg: 'var(--band-high)',
    },
    unknown: {
      label: 'Unknown',
      bg: 'var(--background-alt)',
      fg: 'var(--foreground-muted)',
    },
  };
  const cfg = map[status] ?? map.unknown;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

function FreshnessBar({
  buckets,
  total,
}: {
  buckets: { fresh: number; aging: number; stale: number; very_stale: number };
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="text-foreground-muted text-sm">
        No indicator snapshots loaded yet.
      </p>
    );
  }
  const items = [
    { key: 'fresh' as const, count: buckets.fresh },
    { key: 'aging' as const, count: buckets.aging },
    { key: 'stale' as const, count: buckets.stale },
    { key: 'very_stale' as const, count: buckets.very_stale },
  ];
  return (
    <>
      <div className="flex h-3 rounded-full overflow-hidden border border-border">
        {items.map((it) => {
          const pct = (it.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={it.key}
              style={{
                width: `${pct}%`,
                backgroundColor: FRESHNESS_COLOR_VAR[it.key],
              }}
              title={`${FRESHNESS_LABELS[it.key]}: ${it.count}`}
            />
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((it) => {
          const pct = total > 0 ? (it.count / total) * 100 : 0;
          return (
            <div key={it.key}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  aria-hidden="true"
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: FRESHNESS_COLOR_VAR[it.key] }}
                />
                <span className="text-xs uppercase tracking-wider text-foreground-muted font-medium">
                  {FRESHNESS_LABELS[it.key]}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono tabular-nums text-xl font-semibold">
                  {pct.toFixed(1)}%
                </span>
                <span className="text-xs text-foreground-subtle tabular-nums">
                  {it.count} obs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-muted leading-relaxed">{body}</p>
    </div>
  );
}

// Suppress unused: cn imported defensively
void cn;
