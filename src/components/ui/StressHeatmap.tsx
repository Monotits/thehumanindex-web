'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { bandFor, META_INDEXES, META_LABELS, type MetaIndex } from '@/lib/ui/tokens';

export interface HeatmapCountry {
  country_code: string;
  name: string;
  flag_emoji: string | null;
  composite: number | null;
  meta: Partial<Record<MetaIndex, number>>;
}

interface StressHeatmapProps {
  countries: HeatmapCountry[];
  className?: string;
}

/**
 * Stress heatmap — 25 countries × 5 meta-indexes dense matrix.
 *
 * Design choices (NYT/FT data-viz idiom):
 *   - Sharp rectangular cells, no rounded corners.
 *   - Tightly packed: 2px column gap, no row gap.
 *   - Full color saturation per cell (band-* CSS variables direct).
 *   - Row hairlines for line-by-line legibility.
 *   - Row hover: subtle bg shift + composite number bolds.
 *   - Column hover: header pill darkens, column highlights.
 *   - Click row → /country/[code].
 */
export function StressHeatmap({ countries, className }: StressHeatmapProps) {
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<MetaIndex | null>(null);

  // Sort by composite desc — hottest at top
  const sorted = [...countries].sort(
    (a, b) => (b.composite ?? -Infinity) - (a.composite ?? -Infinity),
  );

  // Tabular widths — 5col data uses fr units for responsive scaling
  const grid = {
    gridTemplateColumns: 'minmax(150px, 200px) 56px repeat(5, minmax(60px, 1fr))',
  };

  return (
    <div className={cn('w-full', className)}>
      {/* ── Column header ── */}
      <div
        className="grid items-end mb-1.5 border-b border-border pb-2"
        style={grid}
      >
        <div /> {/* country col */}
        <div className="text-[10px] uppercase tracking-wider text-foreground-subtle font-medium text-right pr-2">
          Composite
        </div>
        {META_INDEXES.map((m) => (
          <button
            key={m}
            type="button"
            onMouseEnter={() => setHoverCol(m)}
            onMouseLeave={() => setHoverCol(null)}
            className={cn(
              'text-[10px] uppercase tracking-wider font-medium text-center px-1 py-0.5',
              'transition-colors',
              hoverCol === m ? 'text-foreground' : 'text-foreground-muted',
            )}
          >
            {META_LABELS[m]}
          </button>
        ))}
      </div>

      {/* ── Rows ── */}
      <div>
        {sorted.map((c, i) => (
          <Row
            key={c.country_code}
            country={c}
            rank={i + 1}
            grid={grid}
            hoverCol={hoverCol}
            isRowHover={hoverRow === c.country_code}
            onRowEnter={() => setHoverRow(c.country_code)}
            onRowLeave={() => setHoverRow(null)}
            onColEnter={setHoverCol}
            onColLeave={() => setHoverCol(null)}
          />
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-foreground-muted">
        <span className="uppercase tracking-wider font-medium text-foreground-subtle">
          Scale
        </span>
        {(['low', 'moderate', 'elevated', 'high', 'critical'] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3"
              style={{ backgroundColor: `var(--band-${b})` }}
              aria-hidden="true"
            />
            <span className="capitalize">{b}</span>
          </span>
        ))}
        <span className="ml-auto hidden sm:inline text-foreground-subtle">
          Hover a row or column · click any country
        </span>
      </div>
    </div>
  );
}

// ── Row ─────────────────────────────────────────────────────────────

function Row({
  country,
  rank,
  grid,
  hoverCol,
  isRowHover,
  onRowEnter,
  onRowLeave,
  onColEnter,
  onColLeave,
}: {
  country: HeatmapCountry;
  rank: number;
  grid: React.CSSProperties;
  hoverCol: MetaIndex | null;
  isRowHover: boolean;
  onRowEnter: () => void;
  onRowLeave: () => void;
  onColEnter: (m: MetaIndex) => void;
  onColLeave: () => void;
}) {
  const compositeBand = bandFor(country.composite);
  return (
    <Link
      href={`/country/${country.country_code.toLowerCase()}`}
      onMouseEnter={onRowEnter}
      onMouseLeave={onRowLeave}
      className={cn(
        'grid items-center group',
        'border-b border-border/60',
        'transition-colors',
        isRowHover && 'bg-background-alt/60',
      )}
      style={grid}
    >
      {/* Country (name + flag + rank) */}
      <div className="flex items-center gap-2 pl-2 py-1 text-sm min-w-0">
        <span
          className="text-[10px] tabular-nums text-foreground-subtle w-5 text-right shrink-0"
          aria-hidden="true"
        >
          {rank}
        </span>
        <span aria-hidden="true" className="shrink-0">
          {country.flag_emoji ?? '🏳️'}
        </span>
        <span
          className={cn(
            'truncate transition-colors',
            isRowHover ? 'text-foreground font-medium' : 'text-foreground-muted',
          )}
        >
          {country.name}
        </span>
      </div>

      {/* Composite numeric cell */}
      <div className="py-1 pr-2 text-right">
        <span
          className={cn(
            'font-mono tabular-nums text-sm transition-all',
            isRowHover ? 'font-bold' : 'font-semibold',
          )}
          style={{ color: compositeBand ? `var(--band-${compositeBand})` : undefined }}
        >
          {country.composite !== null ? country.composite.toFixed(1) : '—'}
        </span>
      </div>

      {/* Meta cells — sharp rectangles, tight spacing */}
      {META_INDEXES.map((m) => {
        const v = country.meta[m] ?? null;
        const b = bandFor(v);
        const isColHover = hoverCol === m;
        const emphasize = isRowHover || isColHover;
        return (
          <div
            key={m}
            onMouseEnter={() => onColEnter(m)}
            onMouseLeave={onColLeave}
            className={cn(
              'relative h-7 mr-px',
              v === null && 'border border-dashed border-border/70',
            )}
            style={{
              backgroundColor: b ? `var(--band-${b})` : undefined,
              opacity: v === null ? 0 : emphasize ? 1 : 0.92,
              boxShadow: emphasize
                ? 'inset 0 0 0 1px var(--foreground)'
                : undefined,
            }}
            title={`${country.name} · ${META_LABELS[m]} · ${v !== null ? v.toFixed(1) : 'no data'}`}
          >
            {/* Show value only on row hover, in white mix-blend */}
            {isRowHover && v !== null && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold text-white mix-blend-difference">
                {v.toFixed(0)}
              </span>
            )}
          </div>
        );
      })}
    </Link>
  );
}
