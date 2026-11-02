/** Small fetch helpers shared by live adapters. */

const UA = 'TheHumanIndex/2.0 (+https://thehumanindex.org/data-sources)';

export async function fetchText(url: string, timeoutMs: number, accept = '*/*'): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: accept },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      // Keep a short body snippet: upstream error pages are the only diagnosis we get from Vercel.
      const body = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
      throw new HttpError(res.status, `HTTP ${res.status} ${new URL(url).host}${body ? `: ${body}` : ''}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * fetchText with retries on 5xx / 429 / network errors, bounded by an
 * absolute deadline (epoch ms) so a flaky upstream cannot eat the whole
 * function budget.
 */
export async function fetchTextRetry(
  url: string,
  opts: { deadline: number; accept?: string; attempts?: number; perAttemptMs?: number },
): Promise<string> {
  const attempts = opts.attempts ?? 3;
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    const remaining = opts.deadline - Date.now();
    if (remaining < 2_000) break;
    try {
      return await fetchText(url, Math.min(opts.perAttemptMs ?? 20_000, remaining), opts.accept);
    } catch (e) {
      lastErr = e;
      const retryable = !(e instanceof HttpError) || e.status >= 500 || e.status === 429;
      if (!retryable || i === attempts - 1) break;
      const wait = 1_500 * 2 ** i; // 1.5s, 3s
      if (Date.now() + wait > opts.deadline - 2_000) break;
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr ?? new Error(`deadline exceeded: ${new URL(url).host}`);
}

export async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const text = await fetchText(url, timeoutMs, 'application/json');
  // Some APIs (GDACS) answer an empty body when nothing matches.
  return (text.trim() === '' ? {} : JSON.parse(text)) as T;
}

/** Minimal CSV parser (handles quoted fields with commas / escaped quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** CSV → array of records keyed by header. */
export function csvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/** 'YYYY-MM' → 'YYYY-MM-01'; passes full dates through. */
export function normalizePeriod(p: string): string {
  return /^\d{4}-\d{2}$/.test(p) ? `${p}-01` : p.slice(0, 10);
}

export const ISO2_TO_ISO3: Record<string, string> = {
  AR: 'ARG', AU: 'AUS', BR: 'BRA', CA: 'CAN', FR: 'FRA', DE: 'DEU', IN: 'IND', IL: 'ISR',
  IT: 'ITA', JP: 'JPN', MX: 'MEX', NL: 'NLD', NZ: 'NZL', NO: 'NOR', PL: 'POL', SG: 'SGP',
  ZA: 'ZAF', KR: 'KOR', ES: 'ESP', SE: 'SWE', CH: 'CHE', TR: 'TUR', AE: 'ARE', GB: 'GBR', US: 'USA',
};
export const ISO3_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_ISO3).map(([a, b]) => [b, a])
);
