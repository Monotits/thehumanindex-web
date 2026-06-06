import { bandFor, BAND_LABELS, BAND_BG_CLASS, BAND_TEXT_CLASS, type StressBand } from '@/lib/ui/tokens';
import { cn } from '@/lib/ui/cn';

interface StressBandProps {
  score: number | null | undefined;
  /** Force a specific band regardless of score */
  band?: StressBand;
  /** Visual style */
  variant?: 'badge' | 'pill' | 'inline';
  /** Show the numeric score next to the band label */
  showScore?: boolean;
  /** Numeric size: 'sm' for inline use, 'md' default, 'lg' for hero displays */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Render a stress band classification with appropriate color.
 *
 * Variants:
 *   - badge: rectangular tag with band color
 *   - pill:  rounded with subtle bg + matching text
 *   - inline: text-only colored
 *
 * Usage:
 *   <StressBand score={47.7} />                        → "47.7 Elevated" badge
 *   <StressBand score={47.7} variant="pill" />         → rounded pill
 *   <StressBand band="elevated" variant="inline" />    → just colored "Elevated"
 *   <StressBand score={55.1} showScore size="lg" />    → big composite display
 */
export function StressBand({
  score,
  band: forcedBand,
  variant = 'badge',
  showScore = true,
  size = 'md',
  className,
}: StressBandProps) {
  const band = forcedBand ?? bandFor(score ?? null);
  if (!band) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-foreground-subtle', className)}>
        —
      </span>
    );
  }

  const label = BAND_LABELS[band];
  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size];

  const scoreSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  }[size];

  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-baseline gap-1', BAND_TEXT_CLASS[band], className)}>
        {showScore && score !== null && score !== undefined && (
          <span className={cn('font-mono tabular-nums font-medium', scoreSize)}>
            {score.toFixed(1)}
          </span>
        )}
        <span className="font-medium">{label}</span>
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium',
          BAND_BG_CLASS[band],
          sizeClass,
          className,
        )}
      >
        {showScore && score !== null && score !== undefined && (
          <span className="font-mono tabular-nums">{score.toFixed(1)}</span>
        )}
        <span>{label}</span>
      </span>
    );
  }

  // badge (default)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-medium',
        BAND_BG_CLASS[band],
        sizeClass,
        className,
      )}
    >
      {showScore && score !== null && score !== undefined && (
        <span className="font-mono tabular-nums">{score.toFixed(1)}</span>
      )}
      <span>{label}</span>
    </span>
  );
}
