/**
 * Generate TheHumanIndex_Operations_Guide_v1.1.docx
 *
 * v1.1 adds the J2 batch-fill runbook, env config requirements
 * for the per-country content factory, and the new audit query.
 */

const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat,
  AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType,
} = require('docx');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const PAGE_W = 12240, PAGE_H = 15840, CONTENT_W = 9360;

const p = (text) => new Paragraph({ children: [new TextRun(text)] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullet = (text) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun(text)] });
const code = (text) => new Paragraph({ shading: { fill: 'F4F4F4', type: ShadingType.CLEAR }, children: [new TextRun({ text, font: 'Courier New', size: 20 })] });

const cell = (text, opts = {}) => new TableCell({
  borders, width: { size: opts.w || 4680, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || false, font: opts.mono ? 'Courier New' : undefined, size: opts.mono ? 20 : undefined })] })],
});
const tbl = (cols, rows) => new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: cols, rows });

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1A1A1A' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '2E4E6E' },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '444444' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
      alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'THE HUMAN INDEX', bold: true, size: 40 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Operations Guide', italics: true, size: 24 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Version 1.1 — June 2026', size: 22, bold: true }),
      ]}),
      p(''),

      // 1. Overview
      h1('1. Overview'),
      p('This guide is for the operator (Bugra). It describes how to keep The Human Index running day-to-day, where to look when something breaks, and how to push content into the system on demand. Companion documents: PRD v3.3 for product scope, TechArch v3 for the implementation truth.'),
      p('System lives on three planes:'),
      bullet('Vercel — Next.js public web + cron at /api/cron/refresh-v2.'),
      bullet('Supabase — Postgres + RLS. Sole source of truth.'),
      bullet('PD on Mac — local Node service for content generation. Talks to Supabase with the service-role key. Restarts after code changes.'),

      // 2. Daily Reality
      h1('2. Daily Reality'),
      p('On a normal day the system requires zero human input. Vercel cron refreshes scores ~12 times/day. PD scheduler fires Pulse, Glossary, Research, social feed, layoff jobs on their schedules. Content lands in Supabase. Public site serves it.'),
      p('Where humans intervene:'),
      bullet('Adding a new indicator or country — schema migration + adapter map entry + cron rerun.'),
      bullet('Manual batch fill of glossary/research/pulse — run scripts/fire_content_batches.sh.'),
      bullet('Diagnosing a failed cron run — read response JSON or check Supabase logs.'),
      bullet('Triaging cross-source warnings — query v_recent_divergence_streaks.'),

      // 3. Required Environment
      h1('3. Required Environment'),

      h2('3.1 Vercel'),
      bullet('NEXT_PUBLIC_SUPABASE_URL'),
      bullet('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      bullet('SUPABASE_SERVICE_ROLE_KEY (cron, admin)'),
      bullet('CRON_SECRET (bearer for /api/cron/*)'),

      h2('3.2 PD (~/Desktop/Umay.dev/PD/PD/.env)'),
      bullet('THI_SUPABASE_URL + THI_SUPABASE_SERVICE_KEY — Supabase write access from PD.'),
      bullet('THI_PULSE_AUTO_PUBLISH=true — required for per-country pulse to push to Supabase (else stays in PD\'s local SQLite as draft).'),
      bullet('THI_PULSE_LOCALES=en,tr — locale rotation for per-country pulse generation.'),
      bullet('CLAUDE_CLI (optional) — path to Claude CLI binary. Defaults to "claude" on PATH.'),

      h2('3.3 Mac local'),
      bullet('Node 22+ with npm.'),
      bullet('better-sqlite3 native bindings (built on first npm install).'),
      bullet('Claude Max subscription with CLI access.'),

      // 4. Common Operations
      h1('4. Common Operations'),

      h2('4.1 Trigger cron manually'),
      code('curl -sL -H "Authorization: Bearer $CRON_SECRET" \\'),
      code('  https://www.thehumanindex.org/api/cron/refresh-v2'),
      p('Response includes measurements_collected, adapters_health, divergences_total, and a per-country summary.'),

      h2('4.2 Audit content stock'),
      p('Open scripts/content_audit.sql in Supabase SQL Editor. Eight sections:'),
      bullet('1. Pulse per (country, locale) — count + last published.'),
      bullet('2. Glossary matrix + missing combinations for the 5 pulse-active countries.'),
      bullet('3. Research articles per topic_id × country × locale.'),
      bullet('4. Layoff curated stock by country and confidence tier.'),
      bullet('5. Social feed enrichment volume.'),
      bullet('6. Composite score history (daily density check).'),
      bullet('7. indicator_snapshots count per day (migration 018 sanity).'),
      bullet('8. cross_source_validations status distribution (migration 017 sanity).'),

      h2('4.3 Fire content batches (J2 runbook)'),
      p('When the audit shows under-populated cells, run the one-shot batch script:'),
      code('cd ~/Desktop/Umay.dev/TheHumanIndex/thehumanindex-web'),
      code('bash scripts/fire_content_batches.sh'),
      p('Runs ~75 minutes total. Sequential: 10 glossary batches → 5 research articles → 1 per-country pulse batch. Session log under scripts/.batch_logs/. Continues past per-batch failures with logging.'),

      h2('4.4 Fire a single content batch'),
      code('curl -X POST http://localhost:3001/api/glossary/run \\'),
      code('  -H "Content-Type: application/json" \\'),
      code('  -d \'{"locale":"en","countryCode":"FR","countryName":"France","limit":8}\''),
      p(''),
      code('curl -X POST http://localhost:3001/api/research/run \\'),
      code('  -H "Content-Type: application/json" \\'),
      code('  -d \'{"locale":"en","countryCode":"FR","countryName":"France"}\''),
      p(''),
      code('curl -X POST http://localhost:3001/api/thi/generate-country-pulse \\'),
      code('  -H "Content-Type: application/json" \\'),
      code('  -d \'{"countryCode":"FR","locales":["en"],"publish":true}\''),

      h2('4.5 Public API smoke test'),
      code('curl -sL "https://www.thehumanindex.org/api/transparency/US" | python3 -m json.tool'),
      code('curl -sL "https://www.thehumanindex.org/api/trends/US/unemployment_rate" | python3 -m json.tool'),
      code('curl -sL "https://www.thehumanindex.org/api/glossary?country=US&locale=en&limit=5" | python3 -m json.tool'),
      code('curl -sL "https://www.thehumanindex.org/api/pulse?latest=per_country&locale=en" | python3 -m json.tool'),

      // 5. Troubleshooting
      h1('5. Troubleshooting'),

      h3('Cron run returns measurements_collected = 0'),
      p('Every adapter failed. Check adapters_health array in response. Most likely: Vercel network restriction blocking an upstream (IMF currently in this state). World Bank should always be ok.'),

      h3('measurements_collected drops by a known multiple of 25'),
      p('One indicator stopped routing. Check unrouted_indicators in response. Either: adapter rejected the indicator (provideIndicators set mismatch) or normalize bounds returned null.'),

      h3('cross_source_validations table empty after a cron run'),
      p('Either migration 017 not applied, or no indicator has multiple adapters returning values. Most divergences come from worldBank vs eurostat on unemployment/youth/fertility/gini for the 11 EU+ countries; if eurostat is failing, validation count drops.'),

      h3('Per-country pulse never publishes'),
      p('Common: THI_PULSE_AUTO_PUBLISH not set to true; PD draft stays local. Or scheduler hasn\'t hit Monday 10:00 yet. Manual fix: POST /api/thi/generate-country-pulse with publish=true. If validation_failed status returns "body contains placeholder text", regenerate — Claude occasionally leaves template scaffolding in place.'),

      h3('Glossary run returns generated=0 skipped=N for a new (country, locale)'),
      p('Means all 33 terms already had slugs for that pair (e.g., previous batch covered it). Try a fresh (country, locale) or extend the GLOSSARY_TERMS taxonomy in PD\'s glossary-service.js.'),

      h3('Research run returns "Research articles require a real country, not global"'),
      p('Expected behavior — research is country-anchored. Use a real ISO2 code.'),

      h3('Snapshot count anomaly'),
      p('If today\'s snapshot count is well under 600 something is wrong with the upsert. Check Vercel logs for "indicator_snapshots upsert skipped" warnings — usually a schema mismatch (table not migrated) or constraint violation.'),

      // 6. Adding a New Data Source
      h1('6. Adding a New Data Source (Adapter)'),
      p('Pattern:'),
      bullet('Create src/lib/indicators/sources/<sourceName>.ts implementing IndicatorAdapter.'),
      bullet('Add it to ADAPTERS array in src/lib/indicators/orchestrator.ts in priority order.'),
      bullet('Add INDICATOR_TO_<SOURCE>_CODE map for ID translation if needed.'),
      bullet('If new indicator: add migration N+1 inserting into indicators registry with normalize bounds + meta_index + display_order + icon.'),
      bullet('Type-check, commit, push, run migration in Supabase, trigger cron.'),
      p('Test before commit: npx tsc --noEmit must be clean. The adapter\'s providedIndicators set must exactly match indicators it claims.'),

      // 7. Releasing a Pulse
      h1('7. Releasing a Pulse'),

      h2('7.1 Global Pulse (legacy)'),
      bullet('PD scheduler fires Monday 10:00.'),
      bullet('Validation gate: passes → autoPublish if env flag set, else stays draft.'),
      bullet('Manual: POST /api/thi/generate-pulse then POST /api/thi/publish/<id>.'),

      h2('7.2 Per-country Pulse'),
      bullet('Same scheduler entry triggers the per-country loop after global.'),
      bullet('Locales: THI_PULSE_LOCALES env (default en, currently en,tr).'),
      bullet('Manual: POST /api/thi/generate-country-pulse body { countryCode?, locale?, locales?, publish? }.'),

      h2('7.3 Activating a new country for Pulse'),
      bullet('In Supabase: UPDATE countries SET pulse_active = true WHERE code = \'KR\'; — next Monday cron picks it up.'),
      bullet('Or fire immediately: POST /api/thi/generate-country-pulse { countryCode: "KR", locales: ["en"] }.'),

      // 8. Backups and Disaster Recovery
      h1('8. Backups and Disaster Recovery'),
      bullet('Supabase: tier-default daily backups. Point-in-time recovery available on paid tiers; current usage fits free.'),
      bullet('PD local SQLite: contains drafts only. Production source of truth is always Supabase.'),
      bullet('Code: GitHub repository umay-dev/thehumanindex-web (and PD repo if used).'),
      bullet('Recovery test: clone repo + restore Supabase from backup + redeploy Vercel = full reconstruction in under an hour.'),

      // 9. Changelog
      h1('9. Changelog'),
      h3('v1.1 — June 2026'),
      bullet('Added new env requirements (THI_PULSE_AUTO_PUBLISH, THI_PULSE_LOCALES).'),
      bullet('Added J2 batch fill workflow (scripts/fire_content_batches.sh).'),
      bullet('Added content audit query (scripts/content_audit.sql) with 8 sections.'),
      bullet('Added per-country pulse manual fire endpoint.'),
      bullet('Updated troubleshooting for migrations 017+018 (validations and snapshots).'),
      bullet('Updated public API smoke tests for transparency / trends / glossary / research / pulse.'),
      h3('v1.0 — June 2026'),
      bullet('Initial operational documentation. US-only system, daily cron, 7-domain Pulse.'),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = process.argv[2] || '/tmp/Ops_v1_1.docx';
  fs.writeFileSync(out, buffer);
  console.log('Wrote', out, buffer.length, 'bytes');
});
