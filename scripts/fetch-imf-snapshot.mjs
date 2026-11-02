#!/usr/bin/env node
/**
 * Fetch IMF World Economic Outlook series (DataMapper API) into
 * data/live/imf-weo.json. IMF answers HTTP 403 to Vercel's egress IPs, so
 * this runs in GitHub Actions (.github/workflows/oecd-snapshot.yml).
 * Output is deterministic; projections are kept here and capped to completed
 * years by the adapter.
 *
 * Usage: node scripts/fetch-imf-snapshot.mjs [outPath]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = process.argv[2] ?? 'data/live/imf-weo.json';
const SERIES = { GGXWDG_NGDP: 'General government gross debt, % of GDP' };
const ISO3 = 'ARG AUS BRA CAN FRA DEU IND ISR ITA JPN MEX NLD NZL NOR POL SGP ZAF KOR ESP SWE CHE TUR ARE GBR USA'.split(' ');
const FROM_YEAR = 2010;

async function fetchJson(url, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TheHumanIndex/2.0 (+https://thehumanindex.org/data-sources)', Accept: 'application/json' } });
      if (res.ok) return await res.json();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) { last = e; }
    await new Promise(r => setTimeout(r, Math.min(60_000, 3000 * 2 ** i)));
  }
  throw last;
}

const out = { source: 'IMF DataMapper (World Economic Outlook)', series: {} };
for (const [code, label] of Object.entries(SERIES)) {
  const j = await fetchJson(`https://www.imf.org/external/datamapper/api/v1/${code}`);
  const all = j?.values?.[code] ?? {};
  const countries = {};
  for (const iso3 of ISO3) {
    const ym = all[iso3];
    if (!ym) continue;
    countries[iso3] = Object.entries(ym)
      .map(([y, v]) => [parseInt(y, 10), v])
      .filter(([y, v]) => Number.isInteger(y) && y >= FROM_YEAR && typeof v === 'number')
      .sort((a, b) => a[0] - b[0])
      .map(([y, v]) => [y, Math.round(v * 100) / 100]);
  }
  if (Object.keys(countries).length < 20) throw new Error(`${code}: only ${Object.keys(countries).length} countries — refusing to overwrite`);
  out.series[code] = { label, countries };
  console.log(`${code}: ${Object.keys(countries).length} countries`);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote ${OUT}`);
