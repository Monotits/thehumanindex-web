import { META_LABELS, META_TEXT_CLASS, META_BG_CLASS, type MetaIndex } from '@/lib/ui/tokens';
import clsx from 'clsx';

interface MetaCategoryBadgeProps {
  meta: MetaIndex;
  variant?: 'badge' | 'pill' | 'inline' | 'dot';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Render a meta-index category label with its assigned categorical color.
 *
 * Variants:
 *   - badge: filled rectangle with white text
 *   - pill:  rounded with subtle bg + colored text
 *   - inline: text-only colored
 *   - dot: small colored dot + label (compact list item)
 *
 * Usage:
 *   <MetaCategoryBadge meta="economic" />                  → filled badge
 *   <MetaCategoryBadge meta="social" variant="pill" />     → rounded pill
 *   <MetaCategoryBadge meta="mental" variant="dot" />      → ● Mental
 */
export function MetaCategoryBadge({
  meta,
  variant = 'badge',
  size = 'md',
  className,
}: MetaCategoryBadgeProps) {
  const label = META_LABELS[meta];

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size];

  if (variant === 'inline') {
    return (
      <span className={clsx('font-medium', META_TEXT_CLASS[meta], className)}>
        {label}
      </span>
    );
  }

  if (variant === 'dot') {
    return (
      <span className={clsx('inline-flex items-center gap-1.5', className)}>
        <span
          aria-hidden="true"
          className={clsx('inline-block w-2 h-2 rounded-full', META_BG_CLASS[meta])}
        />
        <span className={clsx('font-medium', META_TEXT_CLASS[meta])}>{label}</span>
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full font-medium',
          META_TEXT_CLASS[meta],
          'bg-background-alt',
          sizeClass,
          className,
        )}
      >
        {label}
      </span>
    );
  }

  // badge (filled, default)
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded font-medium',
        META_BG_CLASS[meta],
        sizeClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
