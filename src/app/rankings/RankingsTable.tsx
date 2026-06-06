'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { StressBand } from '@/components/ui/StressBand';
import {
  bandFor,
  META_INDEXES,
  META_LABELS,
  type MetaIndex,
} from '@/lib/ui/tokens';
import type { RankingRow } from './page';

type SortKey = 'composite' | MetaIndex | 'name';
type SortDir = 'asc' | 'desc';

export function RankingsTable({ rows }: { rows: RankingRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('composite');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === 'name') {
        av = a.name;
        bv = b.name;
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      if (sortKey === 'composite') {
        av = a.composite;
        bv = b.composite;
      } else {
        av = a.meta[sortKey] ?? -Infinity;
        bv = b.meta[sortKey] ?? -Infinity;
      }
      const num = (av as number) - (bv as number);
      return sortDir === 'asc' ? num : -num;
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
      {/* ── Desktop: table ── */}
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
                className="pr-3"
              />
              <SortHeader
                label="Composite"
                sortKey="composite"
                activeKey={sortKey}
                dir={sortDir}
                onClick={toggleSort}
                align="right"
                className="pr-3"
              />
              {META_INDEXES.map((m) => (
                <SortHeader
                  key={m}
                  label={META_LABELS[m]}
                  sortKey={m}
                  activeKey={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                  align="right"
                  className="pr-3"
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

      {/* ── Mobile: stacked card list ── */}
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

      {/* Sort hint */}
      <p className="mt-6 text-xs text-foreground-subtle hidden md:block">
        Click any column header to sort. Click again to reverse.
      </p>
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
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
  className?: string;
}) {
  const active = sortKey === activeKey;
  return (
    <th
      className={cn(
        'py-3 font-medium select-none',
        align === 'right' ? 'text-right' : 'text-left',
        className,
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
