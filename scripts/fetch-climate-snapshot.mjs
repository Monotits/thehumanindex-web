#!/usr/bin/env node
/**
 * Fetch ERA5 country-mean annual temperature (World Bank Climate Change
 * Knowledge Portal, CCKP) into data/live/era5-temperature.json.
 * The temperature_anomaly adapter turns it into "latest completed year minus
 * the 1951–1980 mean", matching the indicator's catalog definition.
 *
 * CCKP collections are named by span (…annual_1950-2025…); try the newest
 * span first and step back until one exists.
 *
 * Usage: node scripts/fetch-climate-snapshot.mjs [outPath]
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = process.argv[2] ?? 'data/live/era5-temperature.json';
const ISO3 = 'ARG AUS BRA CAN FRA DEU IND ISR ITA JPN MEX NLD NZL NOR POL SGP ZAF KOR ESP SWE CHE TUR ARE GBR USA'.split(' ');

async function tryFetch(url) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'TheHumanIndex/2.0 (+https://thehumanindex.org/data-sources)', Accept: 'application/json' } });
      if (res.status === 404) return null;
      if (res.ok) {
        const j = await res.json();
        if (j?.metadata?.status === 'success' && j.data && Object.keys(j.data).length) return j;
        return null;
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 3000 * 2 ** i));
  }
  return null;
}

const lastYear = new Date().getUTCFullYear() - 1;
let found = null, span = null;
for (let end = lastYear; end >= lastYear - 3 && !found; end--) {
  span = `1950-${end}`;
  found = await tryFetch(`https://cckpapi.worldbank.org/cckp/v1/era5-x0.25_timeseries_tas_timeseries_annual_${span}_mean_historical_era5_x0.25_mean/${ISO3.join(',')}?_format=json`);
}
if (!found) throw new Error('CCKP: no ERA5 annual collection found');

const countries = {};
for (const iso3 of ISO3) {
  const ser = found.data[iso3];
  if (!ser) continue;
  countries[iso3] = Object.entries(ser)
    .map(([k, v]) => [parseInt(k.slice(0, 4), 10), v])
    .filter(([y, v]) => Number.isInteger(y) && typeof v === 'number')
    .sort((a, b) => a[0] - b[0])
    .map(([y, v]) => [y, Math.round(v * 100) / 100]);
}
if (Object.keys(countries).length < 20) throw new Error(`only ${Object.keys(countries).length} countries — refusing to overwrite`);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ source: 'World Bank CCKP, ERA5 0.25° country mean annual temperature (°C)', collection: span, countries }) + '\n');
console.log(`ERA5 ${span}: ${Object.keys(countries).length} countries → ${OUT}`);
