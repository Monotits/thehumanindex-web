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
    if (!res.ok) throw new Error(`HTTP ${res.status} ${new URL(url).host}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
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
