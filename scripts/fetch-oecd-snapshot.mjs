#!/usr/bin/env node
/**
 * Fetch OECD monthly unemployment + CPI series into data/live/oecd-monthly.json.
 *
 * Why: sdmx.oecd.org answers HTTP 500 to Vercel's egress IPs (verified
 * 2026-11-02: same query 200 from a browser and from GitHub Actions). This
 * runs daily in GitHub Actions (.github/workflows/oecd-snapshot.yml); the
 * Live cron reads the committed JSON. Output is deterministic (no fetch
 * timestamp) so the workflow only commits when OECD publishes new data.
 *
 * Usage: node scripts/fetch-oecd-snapshot.mjs [outPath]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = process.argv[2] ?? 'data/live/oecd-monthly.json';
const ISO3 = 'ARG+AUS+BRA+CAN+FRA+DEU+IND+ISR+ITA+JPN+MEX+NLD+NZL+NOR+POL+SGP+ZAF+KOR+ESP+SWE+CHE+TUR+ARE+GBR+USA';
const BASE = 'https://sdmx.oecd.org/public/rest/data';
const START = '2010-01';

const QUERIES = {
  unemployment: {
    url: `${BASE}/OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M,1.0/${ISO3}..._Z.Y._T.Y_GE15..M?startPeriod=${START}&format=csv`,
    keep: r => r.MEASURE === 'UNE_LF_M' && r.UNIT_MEASURE === 'PT_LF_SUB',
    dataflow: 'OECD.SDD.TPS:DSD_LFS@DF_IALFS_UNE_M(1.0)',
  },
  cpi_yoy: {
    url: `${BASE}/OECD.SDD.TPS,DSD_PRICES@DF_PRICES_ALL,1.0/${ISO3}.M.N.CPI.PA._T.N.GY?startPeriod=${START}&format=csv`,
    keep: () => true,
    dataflow: 'OECD.SDD.TPS:DSD_PRICES@DF_PRICES_ALL(1.0)',
  },
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).map(l => {
    const cells = l.split(','); // OECD SDMX csv: no quoted commas in these columns
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
  });
}

async function fetchWithRetry(url, attempts = 6) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TheHumanIndex/2.0 (+https://thehumanindex.org/data-sources)', Accept: 'text/csv' } });
      if (res.ok) return await res.text();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
    await new Promise(r => setTimeout(r, Math.min(60_000, 3000 * 2 ** i)));
  }
  throw last;
}

const out = { source: 'OECD Data Explorer (sdmx.oecd.org)', start_period: START, series: {} };
for (const [key, q] of Object.entries(QUERIES)) {
  const recs = parseCsv(await fetchWithRetry(q.url)).filter(q.keep);
  const byCountry = {};
  for (const r of recs) {
    const v = Number(r.OBS_VALUE);
    if (!r.REF_AREA || !r.TIME_PERIOD || !Number.isFinite(v)) continue;
    (byCountry[r.REF_AREA] ??= []).push([r.TIME_PERIOD, Math.round(v * 1e4) / 1e4]);
  }
  const sorted = Object.fromEntries(
    Object.keys(byCountry).sort().map(k => [k, byCountry[k].sort((a, b) => (a[0] < b[0] ? -1 : 1))]),
  );
  if (Object.keys(sorted).length < 10) throw new Error(`${key}: only ${Object.keys(sorted).length} countries — refusing to overwrite`);
  out.series[key] = { dataflow: q.dataflow, countries: sorted };
  console.log(`${key}: ${Object.keys(sorted).length} countries, ${recs.length} obs`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote ${OUT}`);
