/**
 * Research publication gate.
 *
 * A research article is shown publicly only when:
 *   1. its status is 'published' (column added in migration 028; rows read
 *      before that migration have no status and are treated as published), and
 *   2. it does not lean on a RETIRED indicator.
 *
 * (2) is enforced in code as well as in the DB on purpose: retiring an
 * indicator purges its measurements, but articles generated from those
 * measurements survive on their own. ai_job_anxiety (one global value, 79.8 /
 * 99.7, stamped onto every country) stayed live in Research cards for months
 * after the indicator itself was removed.
 */

export const RETIRED_INDICATOR_IDS = ['ai_job_anxiety'] as const;

const RETIRED_TEXT_PATTERN = /ai[\s-]?(job|employment)[\s-]?anxiety/i;

export type ResearchStatus = 'published' | 'under_review' | 'retracted';

export interface PublishableFields {
  status?: string | null;
  title?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  body_markdown?: string | null;
  related_indicators?: string[] | null;
}

export function citesRetiredIndicator(row: PublishableFields): boolean {
  if ((row.related_indicators ?? []).some(id => (RETIRED_INDICATOR_IDS as readonly string[]).includes(id))) {
    return true;
  }
  return [row.title, row.subtitle, row.excerpt, row.body_markdown].some(
    t => typeof t === 'string' && RETIRED_TEXT_PATTERN.test(t),
  );
}

export function effectiveStatus(row: PublishableFields): ResearchStatus {
  if (row.status === 'retracted') return 'retracted';
  if (row.status === 'under_review') return 'under_review';
  if (citesRetiredIndicator(row)) return 'under_review';
  return 'published';
}

export function isPublishable(row: PublishableFields): boolean {
  return effectiveStatus(row) === 'published';
}

/**
 * Run a research_articles select that wants the `status` column, falling back
 * to the same select without it when migration 028 is not applied yet.
 */
export async function selectWithStatusFallback<T>(
  run: (columns: string) => PromiseLike<{ data: unknown; error: { message: string } | null; count?: number | null }>,
  columns: string,
): Promise<{ data: T[]; error: { message: string } | null; count: number | null }> {
  let res = await run(`${columns},status,status_note,updated_at`);
  if (res.error && /status|updated_at|column/i.test(res.error.message)) {
    res = await run(columns);
  }
  const data = res.data == null ? [] : Array.isArray(res.data) ? res.data : [res.data];
  return { data: data as T[], error: res.error, count: res.count ?? null };
}
