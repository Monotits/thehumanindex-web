'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/ui/cn';
import { bandFor } from '@/lib/ui/tokens';

export interface CompositePoint {
  date: string; // YYYY-MM-DD
  value: number;
}

interface CompositeLineChartProps {
  data: CompositePoint[];
  height?: number;
  className?: string;
}

/**
 * Full-size composite history line chart — pure SVG, no chart library.
 *
 * Renders a 90-day composite trend with:
 *   - Band-colored gradient area fill under the line.
 *   - Stroke colored to match the latest value's band.
 *   - Y-axis: 0–100 scale with band threshold lines (gridlines at
 *     25, 45, 65, 80) labeled with band names.
 *   - X-axis: month / day ticks at ~15-day intervals.
 *   - Hover tracking: vertical reference line follows the cursor,
 *     a floating tooltip shows the date and exact composite.
 *   - Latest value marker (filled circle) at the right edge.
 *
 * Renders inside a responsive viewBox so it scales width-fluid.
 */
export function CompositeLineChart({
  data,
  height = 280,
  className,
}: CompositeLineChartProps) {
  const width = 800;
  const padL = 36;
  const padR = 16;
  const padT = 14;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const cleaned = useMemo(
    () => data.filter((p) => Number.isFinite(p.value)),
    [data],
  );

  if (cleaned.length < 2) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-background-alt/30 p-8 text-center text-sm text-foreground-muted',
          className,
        )}
        style={{ minHeight: height }}
      >
        Not enough historical data to plot a trend yet.
      </div>
    );
  }

  // Y range: anchor to 0–100 for stable visual baseline across countries.
  const yMin = 0;
  const yMax = 100;
  const yRange = yMax - yMin;

  // Build chronological X positions (evenly spaced over the data range)
  const xStep = innerW / Math.max(1, cleaned.length - 1);
  const points = cleaned.map((p, i) => ({
    x: padL + i * xStep,
    y: padT + innerH - ((p.value - yMin) / yRange) * innerH,
    date: p.date,
    value: p.value,
  }));

  const latest = points[points.length - 1];
  const latestBand = bandFor(latest.value);
  const strokeColor = latestBand ? `var(--band-${latestBand})` : 'var(--foreground)';

  // SVG path strings
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath =
    `${linePath} L${points[points.length - 1].x.toFixed(2)},${(padT + innerH).toFixed(2)} ` +
    `L${points[0].x.toFixed(2)},${(padT + innerH).toFixed(2)} Z`;

  // Y gridlines at band thresholds
  const yTicks = [
    { y: 0, label: '0' },
    { y: 25, label: '25', band: 'moderate' as const },
    { y: 45, label: '45', band: 'elevated' as const },
    { y: 65, label: '65', band: 'high' as const },
    { y: 80, label: '80', band: 'critical' as const },
    { y: 100, label: '100' },
  ];

  // X ticks — first, last, and ~3 in-between (every quarter)
  const xTickIndexes: number[] = [];
  const tickCount = 5;
  for (let i = 0; i < tickCount; i++) {
    const idx = Math.round((points.length - 1) * (i / (tickCount - 1)));
    if (!xTickIndexes.includes(idx)) xTickIndexes.push(idx);
  }

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    if (relX < padL || relX > padL + innerW) {
      setHoverIdx(null);
      return;
    }
    // Find nearest point
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - relX);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    setHoverIdx(bestIdx);
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;

  // Date label formatter — short month + day
  const fmtTick = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const fmtTooltipDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  // Gradient id (stable per render — we don't need useId here because the
  // chart is client-only).
  const gradId = 'composite-area-grad';

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines + labels */}
        {yTicks.map((t) => {
          const y = padT + innerH - ((t.y - yMin) / yRange) * innerH;
          return (
            <g key={t.y}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={t.y === 0 || t.y === 100 ? 1 : 0.5}
                strokeDasharray={t.band ? '2 3' : undefined}
                opacity={t.band ? 0.7 : 1}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fontFamily="var(--font-plex-mono), monospace"
                fill="var(--foreground-subtle)"
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {/* X tick labels */}
        {xTickIndexes.map((idx) => {
          const p = points[idx];
          return (
            <g key={idx}>
              <line
                x1={p.x}
                x2={p.x}
                y1={padT + innerH}
                y2={padT + innerH + 4}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
              <text
                x={p.x}
                y={padT + innerH + 16}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-plex-mono), monospace"
                fill="var(--foreground-subtle)"
              >
                {fmtTick(p.date)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Latest point marker */}
        <circle cx={latest.x} cy={latest.y} r="3.5" fill={strokeColor} />
        <circle
          cx={latest.x}
          cy={latest.y}
          r="6"
          fill={strokeColor}
          opacity="0.18"
        />

        {/* Hover reference line + dot */}
        {hover && (
          <g pointerEvents="none">
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padT}
              y2={padT + innerH}
              stroke="var(--foreground)"
              strokeWidth="0.75"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4"
              fill="var(--background)"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="absolute z-10 pointer-events-none rounded-md border border-border bg-background shadow-lg px-3 py-2 text-xs"
          style={{
            left: `calc(${(hover.x / width) * 100}% + 12px)`,
            top: '12px',
          }}
        >
          <div className="text-foreground-subtle uppercase tracking-wider text-[10px] mb-0.5">
            {fmtTooltipDate(hover.date)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-base font-semibold">
              {hover.value.toFixed(1)}
            </span>
            {bandFor(hover.value) && (
              <span
                className="text-[10px] uppercase tracking-wider font-medium"
                style={{ color: `var(--band-${bandFor(hover.value)})` }}
              >
                {bandFor(hover.value)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Band legend underneath the chart */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-foreground-subtle">
        <span className="uppercase tracking-wider font-medium">Bands</span>
        {(['low', 'moderate', 'elevated', 'high', 'critical'] as const).map((b) => (
          <span key={b} className="inline-flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-0.5"
              style={{ backgroundColor: `var(--band-${b})` }}
              aria-hidden="true"
            />
            <span className="capitalize">{b}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
