import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { cn } from '@/lib/ui/cn';

export const revalidate = 3600;

// ── Types ──────────────────────────────────────────────────────────

interface HealthRow {
  source: string;
  status: 'ok' | 'degraded' | 'failed';
  last_success_at: string | null;
  last_attempt_at: string;
  last_error: string | null;
  data_points_count: number;
  domains_covered: string[] | null;
  duration_ms: number | null;
  recorded_at: string;
}

interface UptimeRow {
  source: string;
  uptime: number | null;
  total_runs: number;
  successful_runs: number;
  most_recent_success: string | null;
}

export interface DataSourceSummary {
  source: string;
  status: 'ok' | 'degraded' | 'failed' | 'unknown';
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  dataPoints: number;
  domains: string[];
  durationMs: number | null;
  uptime30d: number | null;
  totalRuns30d: number;
}

export interface DivergenceRow {
  metric: string;
  domain: string;
  observations: { source: string; indicator: string; rawValue: number; period: string }[];
  divergencePercent: number;
  status: 'ok' | 'warning' | 'critical';
  thresholdPercent: number;
}

// ── Loader ─────────────────────────────────────────────────────────

async function loadSummaries(): Promise<{
  summaries: DataSourceSummary[];
  lastRunAt: string | null;
  divergences: DivergenceRow[];
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { summaries: [], lastRunAt: null, divergences: [] };

  const sb = createClient(url, anon);

  const [latestRes, uptimeRes, latestCompositeRes] = await Promise.all([
    sb.from('v_data_source_health_latest').select('*'),
    sb.from('v_data_source_uptime_30d').select('*'),
    sb
      .from('composite_scores')
      .select('metadata')
      .eq('score_type', 'composite')
      .order('computed_at', { ascending: false })
      .limit(1),
  ]);

  const latest = (latestRes.data as HealthRow[] | null) ?? [];
  const uptime = (uptimeRes.data as UptimeRow[] | null) ?? [];

  const uptimeMap = new Map(uptime.map((u) => [u.source, u]));

  const summaries: DataSourceSummary[] = latest.map((row) => {
    const u = uptimeMap.get(row.source);
    return {
      source: row.source,
      status: row.status,
      lastSuccessAt: row.last_success_at,
      lastAttemptAt: row.last_attempt_at,
      lastError: row.last_error,
      dataPoints: row.data_points_count,
      domains: row.domains_covered ?? [],
      durationMs: row.duration_ms,
      uptime30d: u?.uptime ?? null,
      totalRuns30d: u?.total_runs ?? 0,
    };
  });

  const order = { failed: 0, degraded: 1, ok: 2, unknown: 3 } as const;
  summaries.sort(
    (a, b) => order[a.status] - order[b.status] || a.source.localeCompare(b.source),
  );

  const lastRunAt = latest.map((r) => r.last_attempt_at).sort().at(-1) ?? null;

  const compositeMeta = (
    latestCompositeRes.data as { metadata: Record<string, unknown> | null }[] | null
  )?.[0]?.metadata;
  const divergences: DivergenceRow[] = Array.isArray(compositeMeta?.divergences)
    ? (compositeMeta!.divergences as DivergenceRow[])
    : [];

  return { summaries, lastRunAt, divergences };
}

// ── Page ───────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'in the future';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

export default async function DataSourcesPage() {
  const { summaries, lastRunAt, divergences } = await loadSummaries();

  const ok = summaries.filter((s) => s.status === 'ok').length;
  const degraded = summaries.filter((s) => s.status === 'degraded').length;
  const failed = summaries.filter((s) => s.status === 'failed').length;
  const total = summaries.length;
  const okPct = total > 0 ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <section className="border-b border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-3 font-medium">
              Source health
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight text-balance">
              Where the numbers come from — and whether they&apos;re flowing.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-foreground-muted text-pretty max-w-2xl">
              One row per external adapter. Live status, 30-day uptime, last
              successful pull. Failures stay visible.
            </p>
            <p className="mt-3 text-sm text-foreground-subtle">
              Last cron run: {relativeTime(lastRunAt)}
            </p>
          </div>
        </div>
      </section>

      {/* ── KPI STRIP ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Operational"
            value={`${ok} / ${total}`}
            caption={`${okPct}% green`}
          />
          <KpiCard
            label="Degraded"
            value={`${degraded}`}
            caption="partial / slow"
          />
          <KpiCard
            label="Failing"
            value={`${failed}`}
            caption="urgent investigate"
          />
          <KpiCard
            label="Divergence alerts"
            value={`${divergences.filter((d) => d.status !== 'ok').length}`}
            caption="cross-source disagreements"
          />
        </div>
      </section>

      {/* ── PER-SOURCE TABLE ── */}
      <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
          Per-source status
        </h2>
        <p className="text-foreground-muted max-w-2xl mb-8">
          Sorted by status (failing first). Click a source row to view its last
          error in the inline expansion.
        </p>

        {summaries.length === 0 ? (
          <p className="text-foreground-muted">No source data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-strong text-xs uppercase tracking-wider text-foreground-muted">
                  <th className="text-left py-3 pr-3 font-medium">Source</th>
                  <th className="text-left py-3 pr-3 font-medium">Status</th>
                  <th className="text-right py-3 pr-3 font-medium">Uptime 30d</th>
                  <th className="text-right py-3 pr-3 font-medium">Data points</th>
                  <th className="text-right py-3 pr-3 font-medium">Duration</th>
                  <th className="text-right py-3 pr-3 font-medium">Last success</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr
                    key={s.source}
                    className="border-b border-border align-top hover:bg-background-alt/40"
                  >
                    <td className="py-3 pr-3">
                      <div className="font-medium">{s.source}</div>
                      {s.domains.length > 0 && (
                        <div className="text-xs text-foreground-subtle mt-1">
                          {s.domains.slice(0, 3).join(', ')}
                          {s.domains.length > 3 && ` +${s.domains.length - 3}`}
                        </div>
                      )}
                      {s.lastError && (
                        <details className="mt-2">
                          <summary className="text-xs text-foreground-subtle cursor-pointer hover:text-foreground-muted">
                            Last error
                          </summary>
                          <pre className="mt-1 text-[11px] text-foreground-muted whitespace-pre-wrap font-mono bg-background-alt/60 rounded p-2">
                            {s.lastError}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <StatusPill status={s.status} />
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums">
                      {s.uptime30d !== null
                        ? `${(s.uptime30d * 100).toFixed(1)}%`
                        : '—'}
                      <div className="text-[10px] text-foreground-subtle tabular-nums">
                        {s.totalRuns30d} runs
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums">
                      {s.dataPoints.toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono tabular-nums text-foreground-muted">
                      {s.durationMs !== null ? `${s.durationMs}ms` : '—'}
                    </td>
                    <td className="py-3 pr-3 text-right text-foreground-muted tabular-nums">
                      {relativeTime(s.lastSuccessAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── DIVERGENCES ── */}
      {divergences.length > 0 && (
        <section className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-2">
            Cross-source divergences (current run)
          </h2>
          <p className="text-foreground-muted max-w-2xl mb-8">
            When two independent feeds publish the same indicator, we compare
            and flag disagreements above a per-indicator threshold.
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {divergences.map((d, i) => (
              <li key={`${d.metric}-${i}`} className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span className="font-medium">{d.metric}</span>
                      <span className="text-xs text-foreground-subtle uppercase tracking-wide">
                        {d.domain}
                      </span>
                    </div>
                    <div className="text-xs text-foreground-muted">
                      Threshold: {d.thresholdPercent.toFixed(1)}% · actual:{' '}
                      <span
                        className="font-mono tabular-nums font-medium"
                        style={{
                          color:
                            d.status === 'critical'
                              ? 'var(--band-high)'
                              : d.status === 'warning'
                                ? 'var(--band-moderate)'
                                : 'var(--band-low)',
                        }}
                      >
                        {d.divergencePercent.toFixed(1)}%
                      </span>
                    </div>
                    {d.observations.length > 0 && (
                      <div className="mt-2 text-xs text-foreground-muted">
                        {d.observations.map((o, j) => (
                          <span key={j} className="inline-flex items-baseline gap-1 mr-3">
                            <span className="font-medium text-foreground">{o.source}</span>
                            <span className="font-mono tabular-nums">
                              {o.rawValue.toFixed(2)}
                            </span>
                            <span className="text-foreground-subtle">({o.period})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
                      d.status === 'critical'
                        ? 'bg-band-high-bg text-band-high'
                        : d.status === 'warning'
                          ? 'bg-band-moderate-bg text-band-moderate'
                          : 'bg-band-low-bg text-band-low',
                    )}
                  >
                    {d.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── LINKS ── */}
      <section className="border-t border-border bg-background-alt/40">
        <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-foreground-muted max-w-md">
              See the high-level trust scoreboard on{' '}
              <Link
                href="/transparency"
                className="underline underline-offset-2 hover:text-foreground"
              >
                /transparency
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/methodology"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                Methodology
              </Link>
              <Link
                href="/api/transparency"
                className="text-foreground-muted hover:text-foreground underline underline-offset-2 decoration-foreground-subtle/40"
              >
                JSON API
              </Link>
            </div>
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

function StatusPill({ status }: { status: DataSourceSummary['status'] }) {
  const map: Record<
    DataSourceSummary['status'],
    { label: string; bg: string; fg: string }
  > = {
    ok: { label: 'Operational', bg: 'rgba(107,142,90,0.18)', fg: 'var(--band-low)' },
    degraded: { label: 'Degraded', bg: 'rgba(214,163,92,0.18)', fg: 'var(--band-moderate)' },
    failed: { label: 'Failing', bg: 'rgba(165,62,62,0.18)', fg: 'var(--band-high)' },
    unknown: { label: 'Unknown', bg: 'var(--background-alt)', fg: 'var(--foreground-muted)' },
  };
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}
