'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { StressBand } from '@/components/ui/StressBand';
import { SparklineMini } from '@/components/ui/SparklineMini';
import { WorldMap, type WorldMapCountry } from '@/components/ui/WorldMap';
import { StressHeatmap, type HeatmapCountry } from '@/components/ui/StressHeatmap';
import {
  bandFor,
  META_INDEXES,
  META_LABELS,
  type MetaIndex,
} from '@/lib/ui/tokens';

export interface ExplorerRow {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number;
  meta: Partial<Record<MetaIndex, number>>;
  history: Array<number | null>;
}

const VIEWS = ['grid', 'table', 'map', 'heatmap'] as const;
type View = (typeof VIEWS)[number];

function isView(v: string | null | undefined): v is View {
  return (VIEWS as readonly string[]).includes(v ?? '');
}

const VIEW_LABEL: Record<View, string> = {
  grid: 'Cards',
  table: 'Table',
  map: 'Map',
  heatmap: 'Heatmap',
};

const VIEW_DESCRIPTION: Record<View, string> = {
  grid: 'One card per country with composite + meta-index breakdown.',
  table: 'Sortable rows. Click any column header to reorder.',
  map: 'World choropleth. Hover for the full read-out.',
  heatmap: 'Dense 25×5 matrix. Read across or down.',
};

export function CountriesExplorer({ rows }: { rows: ExplorerRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get('view');
  const [view, setView] = useState<View>(isView(initial) ? initial : 'grid');

  function changeView(next: View) {
    setView(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'grid') params.delete('view');
    else params.set('view', next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div>
      {/* ── VIEW TOGGLE ── */}
      <div className="mb-8 border-b border-border">
        <div className="flex flex-wrap items-end gap-1 -mb-px">
          {VIEWS.map((v) => {
            const active = v === view;
            return (
              <button
                key={v}
                type="button"
                onClick={() => changeView(v)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-foreground-muted hover:text-foreground',
                )}
                aria-pressed={active}
              >
                <ViewIcon view={v} active={active} />
                {VIEW_LABEL[v]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-foreground-subtle mt-3">
          {VIEW_DESCRIPTION[view]}
        </p>
      </div>

      {/* ── ACTIVE VIEW ── */}
      {view === 'grid' && <GridView rows={rows} />}
      {view === 'table' && <TableView rows={rows} />}
      {view === 'map' && <MapView rows={rows} />}
      {view === 'heatmap' && <HeatmapView rows={rows} />}
    </div>
  );
}

// ── Grid view (cards) ──────────────────────────────────────────────

function GridView({ rows }: { rows: ExplorerRow[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((r, i) => (
        <CountryCard key={r.country_code} country={r} rank={i + 1} />
      ))}
    </div>
  );
}

function CountryCard({ country, rank }: { country: ExplorerRow; rank: number }) {
  const band = bandFor(country.composite);
  return (
    <Link
      href={`/country/${country.country_code.toLowerCase()}`}
      className="group block rounded-lg border border-border bg-background hover:bg-background-alt/60 transition-colors p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-foreground-subtle tabular-nums w-6">
          #{rank}
        </span>
        <span className="text-2xl shrink-0" aria-hidden="true">
          {country.flag_emoji ?? '🏳️'}
        </span>
        <span className="text-base font-semibold flex-1 group-hover:underline decoration-foreground-subtle/40 underline-offset-2 truncate">
          {country.name}
        </span>
      </div>

      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono tabular-nums text-3xl font-semibold">
          {country.composite.toFixed(1)}
        </span>
        {band && (
          <StressBand band={band} score={null} showScore={false} variant="pill" size="sm" />
        )}
        {country.history.filter((v) => v !== null).length >= 2 && (
          <SparklineMini
            data={country.history}
            width={70}
            height={22}
            className="ml-auto"
            stroke="var(--foreground-subtle)"
          />
        )}
      </div>

      <div className="space-y-1.5">
        {META_INDEXES.map((m) => (
          <MetaBar key={m} meta={m} value={country.meta[m] ?? null} />
        ))}
      </div>
    </Link>
  );
}

function MetaBar({ meta, value }: { meta: MetaIndex; value: number | null }) {
  const pct = value !== null ? Math.min(100, Math.max(0, value)) : 0;
  const band = bandFor(value);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 sm:w-24 text-foreground-muted shrink-0 truncate">
        {META_LABELS[meta]}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-background-alt overflow-hidden">
        {value !== null && (
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: band ? `var(--band-${band})` : undefined,
              opacity: 0.85,
            }}
          />
        )}
      </div>
      <span className="font-mono tabular-nums text-foreground-muted w-9 text-right">
        {value !== null ? value.toFixed(0) : '—'}
      </span>
    </div>
  );
}

// ── Table view (sortable) ──────────────────────────────────────────

type SortKey = 'composite' | MetaIndex | 'name';
type SortDir = 'asc' | 'desc';

function TableView({ rows }: { rows: ExplorerRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('composite');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const av = sortKey === 'composite' ? a.composite : a.meta[sortKey] ?? -Infinity;
      const bv = sortKey === 'composite' ? b.composite : b.meta[sortKey] ?? -Infinity;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-strong text-xs uppercase tracking-wider text-foreground-muted">
              <th className="text-left py-3 pl-2 pr-3 font-medium w-12">#</th>
              <SortHeader
                label="Country"
                sortKey="name"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                align="left"
              />
              <SortHeader
                label="Composite"
                sortKey="composite"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                align="right"
              />
              <th className="text-right py-3 pr-3 font-medium">Trend 60d</th>
              {META_INDEXES.map((m) => (
                <SortHeader
                  key={m}
                  label={META_LABELS[m]}
                  sortKey={m}
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                  align="right"
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const band = bandFor(r.composite);
              return (
                <tr
                  key={r.country_code}
                  className="border-b border-border hover:bg-background-alt/50"
                >
                  <td className="py-3 pl-2 pr-3 text-foreground-subtle tabular-nums text-xs">
                    {i + 1}
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={`/country/${r.country_code.toLowerCase()}`}
                      className="inline-flex items-center gap-2 hover:underline underline-offset-2 decoration-foreground-subtle/40"
                    >
                      <span className="text-lg" aria-hidden="true">
                        {r.flag_emoji ?? '🏳️'}
                      </span>
                      <span className="font-medium">{r.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="inline-flex items-baseline gap-2">
                      <span className="font-mono tabular-nums text-base font-semibold">
                        {r.composite.toFixed(1)}
                      </span>
                      {band && (
                        <StressBand band={band} score={null} showScore={false} variant="pill" size="sm" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {r.history.filter((v) => v !== null).length >= 2 ? (
                      <SparklineMini
                        data={r.history}
                        width={70}
                        height={20}
                        stroke="var(--foreground-subtle)"
                      />
                    ) : (
                      <span className="text-foreground-subtle">—</span>
                    )}
                  </td>
                  {META_INDEXES.map((m) => {
                    const v = r.meta[m];
                    const b = bandFor(v ?? null);
                    return (
                      <td key={m} className="py-3 pr-3 text-right">
                        {v !== undefined ? (
                          <span
                            className="font-mono tabular-nums"
                            style={{ color: b ? `var(--band-${b})` : undefined }}
                          >
                            {v.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-foreground-subtle">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((r, i) => {
          const band = bandFor(r.composite);
          return (
            <Link
              key={r.country_code}
              href={`/country/${r.country_code.toLowerCase()}`}
              className="block rounded-lg border border-border bg-background hover:bg-background-alt/60 transition-colors p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-foreground-subtle tabular-nums w-6">
                  #{i + 1}
                </span>
                <span className="text-xl" aria-hidden="true">
                  {r.flag_emoji ?? '🏳️'}
                </span>
                <span className="font-medium flex-1">{r.name}</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-lg font-semibold">
                    {r.composite.toFixed(1)}
                  </span>
                  {band && (
                    <StressBand band={band} score={null} showScore={false} variant="pill" size="sm" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {META_INDEXES.map((m) => {
                  const v = r.meta[m];
                  const b = bandFor(v ?? null);
                  return (
                    <div key={m} className="text-center">
                      <div className="text-foreground-subtle text-[10px] uppercase tracking-wide truncate">
                        {META_LABELS[m]}
                      </div>
                      <div
                        className="font-mono tabular-nums mt-0.5"
                        style={{ color: b ? `var(--band-${b})` : undefined }}
                      >
                        {v !== undefined ? v.toFixed(0) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
  align = 'right',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === activeKey;
  return (
    <th
      className={cn(
        'py-3 pr-3 font-medium select-none',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground transition-colors',
          active && 'text-foreground',
        )}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'text-[9px] leading-none transition-opacity',
            active ? 'opacity-100' : 'opacity-30',
          )}
        >
          {active && dir === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </th>
  );
}

// ── Map view ───────────────────────────────────────────────────────

function MapView({ rows }: { rows: ExplorerRow[] }) {
  const mapData: WorldMapCountry[] = rows.map((r) => ({
    country_code: r.country_code,
    name: r.name,
    flag_emoji: r.flag_emoji,
    composite: r.composite,
    meta: r.meta,
  }));
  return <WorldMap countries={mapData} />;
}

// ── Heatmap view ───────────────────────────────────────────────────

function HeatmapView({ rows }: { rows: ExplorerRow[] }) {
  const data: HeatmapCountry[] = rows.map((r) => ({
    country_code: r.country_code,
    name: r.name,
    flag_emoji: r.flag_emoji,
    composite: r.composite,
    meta: r.meta,
  }));
  return <StressHeatmap countries={data} />;
}

// ── View icons ─────────────────────────────────────────────────────

function ViewIcon({ view, active }: { view: View; active: boolean }) {
  const color = active ? 'currentColor' : 'currentColor';
  const stroke = { stroke: color, fill: 'none', strokeWidth: 1.5 };
  const w = 14;
  switch (view) {
    case 'grid':
      return (
        <svg width={w} height={w} viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" {...stroke} />
          <rect x="9" y="1" width="6" height="6" {...stroke} />
          <rect x="1" y="9" width="6" height="6" {...stroke} />
          <rect x="9" y="9" width="6" height="6" {...stroke} />
        </svg>
      );
    case 'table':
      return (
        <svg width={w} height={w} viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1" y="2" width="14" height="12" {...stroke} />
          <line x1="1" y1="6" x2="15" y2="6" {...stroke} />
          <line x1="1" y1="10" x2="15" y2="10" {...stroke} />
          <line x1="6" y1="2" x2="6" y2="14" {...stroke} />
        </svg>
      );
    case 'map':
      return (
        <svg width={w} height={w} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" {...stroke} />
          <path d="M1.5 8 H 14.5" {...stroke} />
          <path d="M8 1.5 Q 4 8 8 14.5" {...stroke} />
          <path d="M8 1.5 Q 12 8 8 14.5" {...stroke} />
        </svg>
      );
    case 'heatmap':
      return (
        <svg width={w} height={w} viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1" y="2" width="3" height="2.5" fill="currentColor" opacity="0.4" />
          <rect x="5" y="2" width="3" height="2.5" fill="currentColor" opacity="0.7" />
          <rect x="9" y="2" width="3" height="2.5" fill="currentColor" opacity="0.55" />
          <rect x="13" y="2" width="2" height="2.5" fill="currentColor" opacity="0.85" />
          <rect x="1" y="5.5" width="3" height="2.5" fill="currentColor" opacity="0.6" />
          <rect x="5" y="5.5" width="3" height="2.5" fill="currentColor" opacity="0.3" />
          <rect x="9" y="5.5" width="3" height="2.5" fill="currentColor" opacity="0.75" />
          <rect x="13" y="5.5" width="2" height="2.5" fill="currentColor" opacity="0.45" />
          <rect x="1" y="9" width="3" height="2.5" fill="currentColor" opacity="0.5" />
          <rect x="5" y="9" width="3" height="2.5" fill="currentColor" opacity="0.85" />
          <rect x="9" y="9" width="3" height="2.5" fill="currentColor" opacity="0.4" />
          <rect x="13" y="9" width="2" height="2.5" fill="currentColor" opacity="0.65" />
        </svg>
      );
  }
}
