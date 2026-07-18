import { cn } from '@/lib/ui/cn';
import { useId } from 'react';

interface SparklineMiniProps {
  /** Array of numeric values to plot (chronological order). */
  data: Array<number | null>;
  /** Pixel width of the rendered sparkline. */
  width?: number;
  /** Pixel height of the rendered sparkline. */
  height?: number;
  /** Stroke color of the line. Defaults to current text color. */
  stroke?: string;
  /** Optional gradient fill underneath the line. */
  filled?: boolean;
  /** Highlight the latest point with a dot. */
  showEndPoint?: boolean;
  /** Force min/max y-axis (defaults to data range). */
  yMin?: number;
  yMax?: number;
  className?: string;
  /** Optional ARIA label. */
  ariaLabel?: string;
}

/**
 * Tiny inline sparkline for trend indication.
 *
 * Renders as pure inline SVG with no external chart library — fast,
 * SSR-friendly, can be used inside text, table rows, hover cards.
 *
 * Usage:
 *   <SparklineMini data={[3.2, 3.4, 3.1, 3.6, 4.0]} />            → 80×20px
 *   <SparklineMini data={...} width={120} height={32} filled />
 *   <SparklineMini data={...} stroke="var(--band-elevated)" />
 */
export function SparklineMini({
  data,
  width = 80,
  height = 20,
  stroke = 'currentColor',
  filled = false,
  showEndPoint = false,
  yMin,
  yMax,
  className,
  ariaLabel,
}: SparklineMiniProps) {
  // Gradient id for fill (stable across SSR + hydration via useId).
  // Rules-of-hooks: erken return'den ÖNCE çağrılmalı — koşullu hook çağrısı
  // veri "yok→var" değişiminde hook sırasını bozup render hatası üretebilir.
  const uniqueId = useId();
  const gradId = `spark-grad-${uniqueId.replace(/:/g, '')}`;

  // Strip nulls but remember their positions for gap rendering
  const cleanData = data.filter((d): d is number => d !== null && Number.isFinite(d));
  if (cleanData.length < 2) {
    return (
      <span
        className={cn('inline-flex items-center text-foreground-subtle', className)}
        style={{ width, height }}
        aria-label={ariaLabel ?? 'No trend data'}
      >
        —
      </span>
    );
  }

  const min = yMin ?? Math.min(...cleanData);
  const max = yMax ?? Math.max(...cleanData);
  const range = max - min || 1;

  // Build polyline points
  const stepX = width / (data.length - 1);
  const points: string[] = [];
  let firstValidX: number | null = null;
  let lastValidX: number | null = null;
  let lastValidY: number | null = null;
  const padY = 2; // small inset so the line doesn't touch top/bottom edges
  const innerH = height - padY * 2;

  data.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) return;
    const x = i * stepX;
    const y = padY + innerH - ((v - min) / range) * innerH;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    if (firstValidX === null) firstValidX = x;
    lastValidX = x;
    lastValidY = y;
  });

  const pointsStr = points.join(' ');
  // Build fill path (line + bottom corners)
  const fillPath =
    filled && firstValidX !== null && lastValidX !== null
      ? `M${firstValidX},${height} L${pointsStr} L${lastValidX},${height} Z`
      : '';

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `Trend over ${data.length} points`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block align-middle', className)}
      preserveAspectRatio="none"
    >
      {filled && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#${gradId})`} />
        </>
      )}
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsStr}
      />
      {showEndPoint && lastValidX !== null && lastValidY !== null && (
        <circle cx={lastValidX} cy={lastValidY} r="2" fill={stroke} />
      )}
    </svg>
  );
}
