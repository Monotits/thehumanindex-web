'use client';

import { useState } from 'react';
import { bandFor } from '@/lib/ui/tokens';

export interface AnnualPoint {
  year: number;
  value: number;
  /** Optional per-meta values for the tooltip. */
  meta?: Record<string, number | null>;
}

const META_ORDER = ['economic', 'social', 'mental', 'environmental'];

/** Annual line chart (SVG). Y-axis auto-scales to the data so 25-year moves are legible. */
export function AnnualHistoryChart({
  data,
  highlight,
  annotations = [],
  height = 260,
}: {
  data: AnnualPoint[];
  highlight?: { from: number; to: number } | null;
  annotations?: { year: number; label: string }[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = data.filter(d => Number.isFinite(d.value));
  if (pts.length < 2) return null;

  const width = 800, padL = 36, padR = 16, padT = 14, padB = 24;
  const innerW = width - padL - padR, innerH = height - padT - padB;
  const vals = pts.map(p => p.value);
  const yMin = Math.max(0, Math.floor((Math.min(...vals) - 5) / 5) * 5);
  const yMax = Math.min(100, Math.ceil((Math.max(...vals) + 5) / 5) * 5);
  const x = (i: number) => padL + (i * innerW) / (pts.length - 1);
  const y = (v: number) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const latest = pts[pts.length - 1];
  const band = bandFor(latest.value);
  const stroke = band ? `var(--band-${band})` : 'var(--foreground)';
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const yTicks = Array.from({ length: Math.floor((yMax - yMin) / 5) + 1 }, (_, i) => yMin + i * 5).filter((v, _, a) => a.length <= 7 || v % 10 === 0);
  const xTicks = pts.map((p, i) => ({ p, i })).filter(({ p, i }) => i === 0 || i === pts.length - 1 || p.year % 5 === 0);
  const hi = highlight ? { a: pts.findIndex(p => p.year === highlight.from), b: pts.findIndex(p => p.year === highlight.to) } : null;
  const h = hover !== null ? pts[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`Annual historical structural index, ${pts[0].year}–${latest.year}`}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          const rel = ((e.clientX - r.left) / r.width) * width;
          const i = Math.round(((rel - padL) / innerW) * (pts.length - 1));
          setHover(i >= 0 && i < pts.length ? i : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {hi && hi.a >= 0 && hi.b > hi.a && (
          <rect x={x(hi.a)} y={padT} width={x(hi.b) - x(hi.a)} height={innerH} fill="var(--foreground)" opacity="0.05" />
        )}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} x2={padL + innerW} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="0.5" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fontFamily="var(--font-plex-mono), monospace" fill="var(--foreground-subtle)">{v}</text>
          </g>
        ))}
        {xTicks.map(({ p, i }) => (
          <text key={p.year} x={x(i)} y={padT + innerH + 16} textAnchor="middle" fontSize="10" fontFamily="var(--font-plex-mono), monospace" fill="var(--foreground-subtle)">{p.year}</text>
        ))}
        {annotations.map((a, k) => {
          const i = pts.findIndex(p => p.year === a.year);
          if (i < 0) return null;
          const lx = x(i);
          const anchor = i > (pts.length - 1) * 0.88 ? 'end' : 'start';
          return (
            <g key={`${a.year}-${a.label}`}>
              <line x1={lx} x2={lx} y1={padT} y2={padT + innerH} stroke="var(--foreground-subtle)" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
              <text x={lx + (anchor === 'start' ? 4 : -4)} y={padT + 10 + (k % 2) * 12} textAnchor={anchor} fontSize="10" fill="var(--foreground-muted)">{a.label}</text>
            </g>
          );
        })}
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={p.year} cx={x(i)} cy={y(p.value)} r={hover === i ? 4 : 2} fill={stroke} />)}
        {h && <line x1={x(hover!)} x2={x(hover!)} y1={padT} y2={padT + innerH} stroke="var(--foreground-subtle)" strokeWidth="0.5" strokeDasharray="2 3" />}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-border bg-background px-3 py-2 text-xs shadow-sm"
          style={{ left: `${Math.min(75, Math.max(2, (x(hover!) / width) * 100))}%` }}
        >
          <div className="font-medium">{h.year}</div>
          <div className="font-mono tabular-nums">{h.value.toFixed(1)}</div>
          {h.meta && META_ORDER.filter(m => h.meta![m] !== null && h.meta![m] !== undefined).map(m => (
            <div key={m} className="text-foreground-muted capitalize">{m}: <span className="font-mono tabular-nums">{h.meta![m]!.toFixed(1)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}
