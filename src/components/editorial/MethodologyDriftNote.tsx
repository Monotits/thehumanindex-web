import Link from 'next/link';
import { CHANGELOG, CURRENT_METHOD_VERSION } from '@/lib/changelog/entries';

/** Date (YYYY-MM-DD) of the newest methodology change in the public changelog. */
export function latestMethodologyChange(): string | null {
  return CHANGELOG.filter(e => e.kind === 'methodology').map(e => e.date).sort().pop() ?? null;
}

/**
 * Shown on AI-written articles (Pulse, Research) published on or before the
 * newest methodology change: the indicators, sources and figures they quote
 * may since have been revised or retired. Same-day articles count as "before"
 * because the changelog is dated by day.
 */
export function MethodologyDriftNote({ publishedAt }: { publishedAt: string | null | undefined }) {
  const changed = latestMethodologyChange();
  if (!changed || !publishedAt || publishedAt.slice(0, 10) > changed) return null;
  const when = new Date(`${changed}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return (
    <aside className="mb-8 rounded-lg border border-border bg-background-alt/40 px-4 py-3 text-sm text-foreground-muted" aria-label="Methodology changed since publication">
      <strong className="text-foreground font-medium">Written before the methodology update of {when}.</strong>{' '}
      Some indicators, sources or figures quoted here have since been revised or retired (current version v{CURRENT_METHOD_VERSION}).{' '}
      <Link href="/changelog" className="underline underline-offset-2">See what changed</Link>.
    </aside>
  );
}
