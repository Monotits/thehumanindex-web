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
 * Stress heatmap — 25 countries × 5 meta-indexes grid.
 *
 * Visual: each row is one country, each column one meta-index, each
 * cell colored by stress band. Hover highlights row + column and
 * surfaces a tooltip with the country / meta / score. Click any row
 * → country detail page.
 *
 * The hero data viz for the homepage. Pure SVG-free implementation;
 * uses CSS grid + Tailwind so it scales / re-flows without measurement.
 */
export function StressHeatmap({ countries, className }: StressHeatmapProps) {
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<MetaIndex | null>(null);

  // Sort by composite desc — highest stress at top, makes the visual reading natural
  const sorted = [...countries].sort(
    (a, b) => (b.composite ?? -Infinity) - (a.composite ?? -Infinity),
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Column header row */}
      <div
        className="grid items-end gap-1 mb-2"
        style={{ gridTemplateColumns: '180px 56px repeat(5, 1fr)' }}
      >
        <div /> {/* country name col */}
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
              'text-[10px] uppercase tracking-wider font-medium text-center px-1 py-1 rounded',
              'transition-colors',
              hoverCol === m
                ? 'text-foreground bg-background-alt'
                : 'text-foreground-muted',
            )}
            style={{ textOrientation: 'mixed' }}
          >
            {META_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {sorted.map((c) => (
          <Row
            key={c.country_code}
            country={c}
            hoverCol={hoverCol}
            isRowHover={hoverRow === c.country_code}
            onRowEnter={() => setHoverRow(c.country_code)}
            onRowLeave={() => setHoverRow(null)}
            onColEnter={setHoverCol}
            onColLeave={() => setHoverCol(null)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-foreground-muted">
        <span className="uppercase tracking-wider font-medium text-foreground-subtle">
          Band scale
        </span>
        {(['low', 'moderate', 'elevated', 'high', 'critical'] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded"
              style={{ backgroundColor: `var(--band-${b})` }}
            />
            <span className="capitalize">{b}</span>
          </span>
        ))}
        <span className="ml-auto text-foreground-subtle hidden sm:inline">
          Hover any row or column · click a country for detail
        </span>
      </div>
    </div>
  );
}

// ── Row ─────────────────────────────────────────────────────────────

function Row({
  country,
  hoverCol,
  isRowHover,
  onRowEnter,
  onRowLeave,
  onColEnter,
  onColLeave,
}: {
  country: HeatmapCountry;
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
        'grid items-center gap-1 group rounded',
        'transition-colors',
        isRowHover && 'bg-background-alt/60',
      )}
      style={{ gridTemplateColumns: '180px 56px repeat(5, 1fr)' }}
    >
      {/* Country */}
      <div className="flex items-center gap-2 pl-2 py-1.5 text-sm min-w-0">
        <span aria-hidden="true">{country.flag_emoji ?? '🏳️'}</span>
        <span
          className={cn(
            'truncate transition-colors',
            isRowHover ? 'text-foreground font-medium' : 'text-foreground-muted',
          )}
        >
          {country.name}
        </span>
      </div>

      {/* Composite cell */}
      <div className="py-1.5 pr-2 text-right">
        <span
          className="font-mono tabular-nums text-sm font-semibold"
          style={{ color: compositeBand ? `var(--band-${compositeBand})` : undefined }}
        >
          {country.composite !== null ? country.composite.toFixed(1) : '—'}
        </span>
      </div>

      {/* Meta cells */}
      {META_INDEXES.map((m) => {
        const v = country.meta[m] ?? null;
        const b = bandFor(v);
        const isColHover = hoverCol === m;
        return (
          <div
            key={m}
            onMouseEnter={() => onColEnter(m)}
            onMouseLeave={onColLeave}
            className={cn(
              'relative h-7 mx-0.5 rounded transition-transform',
              isRowHover || isColHover ? 'scale-y-[1.15]' : '',
              v === null && 'border border-dashed border-border',
            )}
            style={{
              backgroundColor: b ? `var(--band-${b})` : undefined,
              opacity: v === null ? 0.3 : (isRowHover || isColHover ? 1 : 0.9),
            }}
            title={`${country.name} · ${META_LABELS[m]} · ${v !== null ? v.toFixed(1) : 'no data'}`}
          >
            {/* Value shown only on row hover */}
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
