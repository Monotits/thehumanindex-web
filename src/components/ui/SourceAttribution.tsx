import {
  freshnessFor,
  FRESHNESS_LABELS,
  FRESHNESS_COLOR_VAR,
  CONFIDENCE_LABELS,
  CONFIDENCE_COLOR_VAR,
  type ConfidenceTier,
  type Freshness,
} from '@/lib/ui/tokens';
import clsx from 'clsx';

interface SourceAttributionProps {
  /** Display name of the source organization. */
  source: string;
  /** Reference date (e.g. data covers period ending YYYY-MM-DD). */
  referenceDate?: string | Date | null;
  /** Optional explicit freshness override (otherwise computed from referenceDate). */
  freshness?: Freshness | null;
  /** Optional confidence tier badge. */
  confidence?: ConfidenceTier | null;
  /** Optional link to the source page. */
  href?: string;
  /** Layout: `inline` for in-text, `block` for footer/standalone. */
  variant?: 'inline' | 'block';
  className?: string;
}

/**
 * Source attribution badge — a transparency primitive.
 *
 * Renders the source name, reference date, freshness signal and confidence
 * tier as a compact citation strip. Designed to sit next to a value in a
 * card, table row, or article inline.
 *
 * Usage:
 *   <SourceAttribution source="World Bank" referenceDate="2024-12-31" />
 *   <SourceAttribution
 *     source="IMF WEO"
 *     referenceDate="2024-12-31"
 *     confidence="verified"
 *     href="https://www.imf.org/external/datamapper"
 *   />
 */
export function SourceAttribution({
  source,
  referenceDate,
  freshness,
  confidence,
  href,
  variant = 'inline',
  className,
}: SourceAttributionProps) {
  const fresh = freshness ?? freshnessFor(referenceDate ?? null);
  const dateStr =
    referenceDate instanceof Date
      ? referenceDate.toISOString().slice(0, 10)
      : referenceDate
        ? String(referenceDate).slice(0, 10)
        : null;

  const sourceContent = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-foreground-subtle/40 underline-offset-2 hover:decoration-foreground-muted"
    >
      {source}
    </a>
  ) : (
    <span>{source}</span>
  );

  if (variant === 'block') {
    return (
      <div
        className={clsx(
          'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted',
          className,
        )}
      >
        <span>
          Source: <span className="text-foreground">{sourceContent}</span>
        </span>
        {dateStr && (
          <span>
            As of <time dateTime={dateStr} className="tabular-nums">{dateStr}</time>
          </span>
        )}
        {fresh && (
          <FreshnessBadge freshness={fresh} />
        )}
        {confidence && (
          <ConfidenceBadge confidence={confidence} />
        )}
      </div>
    );
  }

  // inline (default)
  return (
    <span
      className={clsx(
        'inline-flex flex-wrap items-baseline gap-1.5 text-xs text-foreground-muted',
        className,
      )}
    >
      <span className="text-foreground/80">{sourceContent}</span>
      {dateStr && (
        <span className="tabular-nums">· {dateStr}</span>
      )}
      {fresh && (
        <FreshnessBadge freshness={fresh} />
      )}
      {confidence && (
        <ConfidenceBadge confidence={confidence} />
      )}
    </span>
  );
}

// ── Sub-primitives ──────────────────────────────────────────────────

function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-medium"
      style={{ color: FRESHNESS_COLOR_VAR[freshness] }}
      title={`Data freshness: ${FRESHNESS_LABELS[freshness]}`}
    >
      <span
        aria-hidden="true"
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: FRESHNESS_COLOR_VAR[freshness] }}
      />
      {FRESHNESS_LABELS[freshness]}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: ConfidenceTier }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-medium"
      style={{ color: CONFIDENCE_COLOR_VAR[confidence] }}
      title={`Confidence: ${CONFIDENCE_LABELS[confidence]}`}
    >
      <span aria-hidden="true">●</span>
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}
