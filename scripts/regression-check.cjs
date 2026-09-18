/**
 * Zero-dependency regression checks for the trust-critical pure functions.
 * Run: npm run check:regressions
 * (compiles the few TS modules it needs into a temp dir with the repo's tsc)
 */
const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const out = mkdtempSync(path.join(tmpdir(), 'thi-reg-'));
const files = [
  'src/lib/ui/markdown.ts',
  'src/lib/ui/tokens.ts',
  'src/lib/indicators/composeMetaIndex.ts',
  'src/lib/indicators/adapterRegistry.ts',
  'src/lib/research/publishable.ts',
];
try {
  try {
    execFileSync(
      path.join(root, 'node_modules/.bin/tsc'),
      [...files, '--outDir', out, '--rootDir', 'src', '--module', 'commonjs', '--target', 'es2020',
        '--skipLibCheck', '--esModuleInterop', '--noEmitOnError', 'false'],
      { cwd: root, stdio: 'pipe' },
    );
  } catch { /* type noise from path aliases is irrelevant; JS is still emitted */ }

  const { renderMarkdown } = require(path.join(out, 'lib/ui/markdown.js'));
  const { freshnessFor } = require(path.join(out, 'lib/ui/tokens.js'));
  const { composeCountryScores, freshnessWeightFactor } = require(path.join(out, 'lib/indicators/composeMetaIndex.js'));
  const { adapterPriority } = require(path.join(out, 'lib/indicators/adapterRegistry.js'));
  const { isPublishable, effectiveStatus } = require(path.join(out, 'lib/research/publishable.js'));

  const yearsAgo = (y) => new Date(Date.now() - y * 365.25 * 864e5).toISOString();

  // 1. Markdown parser always terminates (indented list used to hang forever)
  for (const src of ['  - item', 'a\n  - x\n    - y', '  1. one', '  -', '####', ' > q', '\t* t']) {
    const t = Date.now();
    renderMarkdown(src);
    assert.ok(Date.now() - t < 200, `markdown slow/hung on ${JSON.stringify(src)}`);
  }
  assert.equal(renderMarkdown('  - item'), '<ul><li>item</li></ul>');

  // 2. Future reference dates are never "fresh"
  assert.equal(freshnessFor('2031-12-31'), null);
  assert.equal(freshnessFor(yearsAgo(1)), 'fresh');
  assert.equal(freshnessFor(yearsAgo(4)), 'stale');
  assert.equal(freshnessFor(yearsAgo(6)), 'very_stale');

  // 3. Stale-data policy matches /methodology
  assert.equal(freshnessWeightFactor(yearsAgo(1)), 1);
  assert.equal(freshnessWeightFactor(yearsAgo(2.5)), 1);
  assert.equal(freshnessWeightFactor(yearsAgo(4)), 0.5);
  assert.equal(freshnessWeightFactor(yearsAgo(6)), 0);
  assert.equal(freshnessWeightFactor('2031-12-31'), 0);

  const ind = (id, meta) => ({ id, meta_index: meta, weight_within_meta: 1 });
  const m = (indicatorId, normalizedValue, referenceDate) => ({
    countryCode: 'TR', indicatorId, rawValue: normalizedValue, normalizedValue, referenceDate, adapterId: 'worldBank',
  });
  const [c] = composeCountryScores(
    [m('a', 100, yearsAgo(1)), m('b', 0, yearsAgo(4)), m('c', 0, yearsAgo(7)), m('d', 0, '2031-12-31')],
    [ind('a', 'economic'), ind('b', 'economic'), ind('c', 'economic'), ind('d', 'economic')],
    ['TR'],
  );
  const econ = c.metaIndexes.find((x) => x.metaIndex === 'economic');
  // (100*1 + 0*0.5) / 1.5 = 66.7 — very stale + future contribute nothing
  assert.equal(econ.value, 66.7);
  assert.equal(econ.indicatorsWithData, 2);
  assert.equal(econ.rawData.excluded.length, 2);
  // score is reproducible from the recorded contributors
  const re = econ.rawData.contributors.reduce((s, x) => s + x.normalizedValue * x.weight, 0) /
    econ.rawData.contributors.reduce((s, x) => s + x.weight, 0);
  assert.equal(Math.round(re * 10) / 10, econ.value);

  // 4. Source priority: retired adapters can never outrank live ones
  assert.ok(adapterPriority('eurostat') < adapterPriority('imf'));
  assert.ok(adapterPriority('imf') < adapterPriority('worldBank'));
  assert.ok(adapterPriority('referenceSeed') < adapterPriority('nasaGiss'));
  assert.ok(adapterPriority('nasaGiss') < adapterPriority('made-up'));

  // 5. Research publication gate
  assert.equal(isPublishable({ title: 'Housing in Spain', excerpt: 'x', related_indicators: ['housing_affordability'] }), true);
  assert.equal(isPublishable({ title: 'x', excerpt: 'AI job anxiety at 79.8', related_indicators: [] }), false);
  assert.equal(isPublishable({ title: 'x', excerpt: 'y', related_indicators: ['ai_job_anxiety'] }), false);
  assert.equal(effectiveStatus({ status: 'retracted', title: 'x' }), 'retracted');
  assert.equal(isPublishable({ status: 'under_review', title: 'x', excerpt: 'y' }), false);

  console.log('✓ regression checks passed');
} finally {
  rmSync(out, { recursive: true, force: true });
}
