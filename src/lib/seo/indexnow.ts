/**
 * IndexNow: tells Bing (which also feeds ChatGPT search and Copilot), Yandex,
 * Seznam and Naver that URLs changed, so refreshed scores are re-crawled within
 * hours instead of weeks. Free; no account needed — ownership is proven by the
 * key file served at /{INDEXNOW_KEY}.txt (public/).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOP_10_CATALOG } from '@/lib/ui/top10-catalog';

export const INDEXNOW_KEY = 'ba451426f175e5032b25b7496470e4f9';
const HOST = 'thehumanindex.org';
const BASE = `https://${HOST}`;

/** URLs whose numbers change when the daily scores change, plus research published in the last 2 days. */
export async function changedUrls(sb: SupabaseClient, countryCodes: string[]): Promise<string[]> {
  const urls = [
    `${BASE}/`, `${BASE}/countries`, `${BASE}/indicators`, `${BASE}/top-10`, `${BASE}/llms-full.txt`,
    ...TOP_10_CATALOG.map(e => `${BASE}/top-10/${e.slug}`),
    ...countryCodes.map(c => `${BASE}/country/${c.toLowerCase()}`),
  ];
  const since = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
  // Pulse articles are noindex, so they are not submitted.
  const research = await sb.from('research_articles').select('slug, status').gte('published_at', since).limit(50);
  for (const r of (research.data ?? []) as { slug: string; status?: string | null }[]) {
    if (!r.status || r.status === 'published') urls.push(`${BASE}/research/${r.slug}`);
  }
  return urls;
}

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; status: number; count: number }> {
  if (urls.length === 0) return { ok: true, status: 0, count: 0 };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10000) }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.ok, status: res.status, count: urls.length };
  } catch {
    return { ok: false, status: 0, count: urls.length };
  }
}
