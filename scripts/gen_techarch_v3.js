/**
 * Generate TheHumanIndex_TechArch_v3.docx
 *
 * v3 covers the global pivot: 18 migrations, 6 production adapters,
 * 7 public read APIs, content factory at scale, per-country pulse.
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
const code = (text) => new Paragraph({ children: [new TextRun({ text, font: 'Courier New', size: 20 })] });

const cell = (text, opts = {}) => new TableCell({
  borders,
  width: { size: opts.w || 4680, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold || false, font: opts.mono ? 'Courier New' : undefined, size: opts.mono ? 20 : undefined })] })],
});

const tbl = (cols, rows) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: cols, rows,
});

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
        new TextRun({ text: 'Technical Architecture', italics: true, size: 24 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Version 3 — June 2026', size: 22, bold: true }),
      ]}),
      p(''),

      // 1. System Overview
      h1('1. System Overview'),
      p('The Human Index runs on three coordinated processes:'),
      bullet('Public Web (Next.js 16 on Vercel) — server-rendered with ISR. Lives at thehumanindex.org. Holds the public API surface, dashboard, and content pages.'),
      bullet('Vercel Cron — invokes /api/cron/refresh-v2 on a schedule. Refreshes 25 indicators × 25 countries from six adapters, normalizes values into 0-100 stress scores, composes meta-index and composite scores, persists divergences and daily snapshots.'),
      bullet('Personal Dashboard (PD) — local Node + React + better-sqlite3 service that runs on Bugra\'s Mac. Acts as the editorial brain: invokes Claude CLI for Pulse / Glossary / Research generation, batches via REST, pushes finished content to Supabase.'),
      p('All three share one source of truth: Supabase Postgres. Direct writes go through service-role keys held by Vercel and PD; public reads always go through the Supabase anon key and RLS.'),

      // 2. Supabase Database
      h1('2. Supabase Database'),
      p('Eighteen migrations have shipped through June 2026. The schema is grouped into four families:'),

      h2('2.1 Legacy single-country scoring (migrations 001-006)'),
      bullet('monthly_scores — single-country composite history. Retained for legacy /history endpoint.'),
      bullet('data_source_health — per-source uptime, last success, error logs. Powers /data-sources page.'),
      bullet('social_feed_curated — Reddit + news posts enriched by Claude Haiku with relevance score + why_matters narrative.'),
      bullet('corporate_layoffs_curated — Layoff events normalized from 17 RSS feeds + SEC EDGAR + CA WARN. Confidence tier: verified / reported / rumored.'),

      h2('2.2 Meta-index framework (migrations 007-008)'),
      bullet('countries — 25 ISO2 codes with region, population, pulse_active flag.'),
      bullet('indicators — registry of 25 active indicators with meta_index, normalize_low/high, normalize_invert, weight, source_org, source_url.'),
      bullet('indicator_values — append-only log of every (country, indicator, adapter) measurement. Indexed by country + indicator + reference_date.'),
      bullet('country_composite_scores — one row per country per cron run with composite + delta + confidence + metadata JSONB.'),
      bullet('meta_index_scores — five rows per composite (one per meta-index) with weighted value + indicator coverage.'),
      bullet('commentary — Pulse articles. Extended in 008 with country_code + locale + pulse_active to support per-country generation.'),

      h2('2.3 Content factory tables (migrations 009-011)'),
      bullet('glossary_entries — per (country, locale, slug). 33 priority term taxonomy. body_markdown is 400-800 word article.'),
      bullet('research_articles — per (country, locale, slug, topic_id). 12 RESEARCH_TOPICS configured in PD. body_markdown 1,500-2,500 words.'),
      bullet('corporate_layoffs_curated.country_code (rename from country in migration 011).'),

      h2('2.4 Indicator expansion (migrations 012-016)'),
      bullet('012 inflation_rate (WB FP.CPI.TOTL.ZG with IMF kept as crosscheck).'),
      bullet('013 gdp_growth_rate, life_expectancy, gov_debt_pct_gdp, co2_per_capita.'),
      bullet('014 mortality_rate_under5, renewable_energy_pct.'),
      bullet('015 alcohol_consumption_per_capita, age_dependency_ratio.'),
      bullet('016 adolescent_fertility_rate, homicide_rate, automation_exposure (seed).'),

      h2('2.5 Credibility infrastructure (migrations 017-018)'),
      bullet('cross_source_validations — one row per (country, indicator) per run with observations JSONB + divergence_pct + status. Indexes on country+indicator+run_at and status+run_at where status != ok.'),
      bullet('v_recent_divergence_streaks — view of pairs with ≥2 non-ok flags in their last 10 runs over 30 days.'),
      bullet('v_indicator_source_breakdown — view returning latest value per (country, indicator, adapter) for the transparency API.'),
      bullet('indicator_snapshots — one row per (country, indicator, day) with UNIQUE(snapshot_date, country_code, indicator_id). Cron upserts idempotently.'),
      bullet('v_indicator_30d_change and v_composite_30d_change — month-over-month delta views.'),

      h2('2.6 RLS posture'),
      p('Every public-readable table has anon SELECT permission. Every view is created WITH (security_invoker = true) so RLS still enforces row visibility. INSERT and UPDATE require the service-role key, never exposed to clients.'),

      // 3. Cron pipeline
      h1('3. Cron Pipeline (Vercel)'),

      h2('3.1 /api/cron/refresh-v2'),
      p('Single entrypoint. Bearer-token gated by CRON_SECRET. maxDuration 60s.'),
      p('Flow per invocation:'),
      bullet('Load active countries + indicators from registry.'),
      bullet('fetchAllIndicatorValues(indicators, countries, 45_000) — calls every adapter in parallel; orchestrator picks one primary per (country, indicator) pair while keeping all observations for divergence checks.'),
      bullet('Persist per-adapter health to data_source_health (v2: prefix).'),
      bullet('Persist cross_source_validations rows (~40 per run currently).'),
      bullet('Persist indicator_values (primary + secondary; ~735 rows).'),
      bullet('Upsert indicator_snapshots (idempotent on same-day reruns).'),
      bullet('composeCountryScores — produces composite + meta-index objects.'),
      bullet('Persist country_composite_scores and meta_index_scores. Compute delta vs previous composite.'),

      h2('3.2 Orchestrator and adapters'),
      p('Files under src/lib/indicators/sources/. Adapter contract:'),
      code("interface IndicatorAdapter {"),
      code("  id: string;"),
      code("  name: string;"),
      code("  providedIndicators: ReadonlySet<string>;"),
      code("  fetchValues({ countries, indicatorIds, timeoutMs }):"),
      code("    Promise<{ measurements, health }>;"),
      code("}"),
      p('Active adapter order (orchestrator routes first-wins):'),
      tbl([2400, 6960], [
        new TableRow({ children: [
          cell('Adapter', { bold: true, fill: 'E8EEF4', w: 2400 }),
          cell('Notes', { bold: true, fill: 'E8EEF4', w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('eurostat', { w: 2400 }),
          cell('JSON-stat 2.0 API. 11 EU+ countries. Wins routing for unemployment/youth/fertility/gini where covered.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('imf', { w: 2400 }),
          cell('IMF Data Mapper. inflation + unemployment series. Currently unreachable from Vercel runtime (network restriction) — returns 0 measurements, kept for future restore.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('worldBank', { w: 2400 }),
          cell('14 indicators × 25 countries. Chunked at 5 countries/request, 15s timeout, single retry on AbortError.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('socialFeedComputed', { w: 2400 }),
          cell('Derives ai_job_anxiety from social_feed_curated relevance scores.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('oecdHousing', { w: 2400 }),
          cell('Annual seed for housing_affordability.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('referenceSeed', { w: 2400 }),
          cell('11 indicators bundled as annual values: water_stress, air_pollution, burnout, divorce, social_trust, loneliness, screen_time, digital_addiction, depression, anxiety, temperature_anomaly (Berkeley Earth per-country), automation_exposure (McKinsey).', { w: 6960 }),
        ]}),
      ]),

      h2('3.3 Normalization'),
      p('normalizeIndicator() in src/lib/indicators/types.ts. Maps raw → 0-100 stress with optional invert. low=0 stress, high=100 stress; invert=true flips. Clamped at bounds. Rounded to one decimal.'),

      h2('3.4 Composition'),
      p('composeCountryScores in src/lib/indicators/composeMetaIndex.ts. Per country: weighted average within each meta-index, then weighted composite. DEFAULT_META_WEIGHTS: economic 0.25, social/mental/technological 0.20 each, environmental 0.15.'),

      h2('3.5 Divergence detection'),
      p('When two or more adapters return values for the same pair, the orchestrator computes |max - min| / mean × 100 as divergencePercent. Compared against DIVERGENCE_THRESHOLDS (warning at ~5%, critical at ~15% per indicator class). Result persists to cross_source_validations.'),

      // 4. Personal Dashboard
      h1('4. Personal Dashboard (PD)'),
      p('PD lives at ~/Desktop/Umay.dev/PD/PD. Node + Express + React + better-sqlite3. Listens on http://localhost:3001.'),

      h2('4.1 THI module'),
      bullet('GET /api/thi/status — local SQLite cache.'),
      bullet('POST /api/thi/fetch-scores — manual Supabase pull into local cache.'),
      bullet('POST /api/thi/generate-pulse — legacy global Pulse.'),
      bullet('POST /api/thi/generate-country-pulse (new) — per-country batch with body { countryCode?, locale?, locales?, publish? }. Loops countries.pulse_active=true when no countryCode given.'),
      bullet('POST /api/thi/publish/:id — manual draft → published transition.'),

      h2('4.2 Glossary module'),
      p('POST /api/glossary/run body { locale, countryCode, countryName, limit }. Iterates the 33-term taxonomy, skipping slugs already present for the (country, locale) pair. Each term goes through Claude Sonnet (1 invocation per term). Persists to Supabase via service-role key.'),

      h2('4.3 Research module'),
      p('POST /api/research/run body { locale, countryCode, countryName }. Picks the first topic from the 12-template rotation that has not yet been written for the pair. countryCode "global" is rejected — research articles are country-anchored.'),

      h2('4.4 Scheduler (node-cron)'),
      tbl([3120, 6240], [
        new TableRow({ children: [
          cell('Schedule', { bold: true, fill: 'E8EEF4', w: 3120 }),
          cell('Job', { bold: true, fill: 'E8EEF4', w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('0 10 * * 1', { mono: true, w: 3120 }),
          cell('Weekly THI Pulse + per-country loop (Monday 10:00)', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('0 8 * * *', { mono: true, w: 3120 }),
          cell('Daily score fetch into local cache', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('30 7,11,15,19,23 * * *', { mono: true, w: 3120 }),
          cell('Social feed enrichment (every 4 hours)', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('0 0,4,8,12,16,20 * * *', { mono: true, w: 3120 }),
          cell('Corporate layoffs extraction', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('0 3 * * *', { mono: true, w: 3120 }),
          cell('Glossary batch (per_run_limit=8)', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('0 4 * * *', { mono: true, w: 3120 }),
          cell('Research article generation (1 per run)', { w: 6240 }),
        ]}),
      ]),

      h2('4.5 Required env'),
      bullet('THI_SUPABASE_SERVICE_KEY — write access to Supabase.'),
      bullet('THI_PULSE_AUTO_PUBLISH=true — gates per-country pulse Supabase push.'),
      bullet('THI_PULSE_LOCALES=en,tr — locale rotation for per-country pulse.'),
      bullet('CLAUDE_CLI optional — defaults to "claude" on PATH.'),

      // 5. Public Web
      h1('5. Public Web (Next.js)'),

      h2('5.1 Route map'),
      p('App Router under src/app/. Locale routing scaffolded with next-intl 4.x using as-needed prefix (English at /, Turkish at /tr/, etc.). Middleware in src/middleware.ts.'),

      h2('5.2 Public read API surface (added in this version)'),
      tbl([3600, 5760], [
        new TableRow({ children: [
          cell('Endpoint', { bold: true, fill: 'E8EEF4', w: 3600 }),
          cell('Backing tables / views', { bold: true, fill: 'E8EEF4', w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/transparency/[country]', { w: 3600 }),
          cell('countries + indicators + v_indicator_source_breakdown + v_recent_divergence_streaks', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/trends/[country]/[indicator]', { w: 3600 }),
          cell('indicator_snapshots (last 90 days)', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/glossary', { w: 3600 }),
          cell('glossary_entries (filters: locale, country, q, meta, indicator). Fallback chain: requested → global/locale → global/en.', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/glossary/[slug]', { w: 3600 }),
          cell('glossary_entries (single) + related_terms hydration.', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/research', { w: 3600 }),
          cell('research_articles (filters: locale, country, topic, meta, indicator).', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/research/[slug]', { w: 3600 }),
          cell('research_articles (single).', { w: 5760 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/pulse and /api/pulse/[country]/[slug]', { w: 3600 }),
          cell('commentary (with v_commentary_latest_per_country in latest=per_country mode).', { w: 5760 }),
        ]}),
      ]),

      h2('5.3 Caching'),
      p('Read APIs use s-maxage 300-600 with stale-while-revalidate. Cron route is force-dynamic. Revalidate hooks under /api/revalidate.'),

      h2('5.4 Required env (Vercel)'),
      bullet('NEXT_PUBLIC_SUPABASE_URL'),
      bullet('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      bullet('SUPABASE_SERVICE_ROLE_KEY (cron + admin only)'),
      bullet('CRON_SECRET'),

      // 6. Operational concerns
      h1('6. Operational Concerns'),

      h2('6.1 Vercel hobby plan'),
      p('60s function maxDuration. Cron-v2 runs in ~10-30s typically. Composite persistence chunked at 500 rows. Validation persistence chunked at 200 rows.'),

      h2('6.2 Supabase footprint'),
      p('indicator_values + indicator_snapshots + cross_source_validations together are ~250k rows/year. Postgres + free tier comfortable through 2027.'),

      h2('6.3 Failure modes'),
      bullet('Adapter timeout → orchestrator continues with other adapters. Failed adapter logged to data_source_health with status degraded/failed and last_success_at preserved.'),
      bullet('IMF unreachable from Vercel → routes 0 measurements; WB picks up inflation primary.'),
      bullet('Per-country pulse validation_failed → stays draft in commentary local table; manual retry via /api/thi/generate-country-pulse.'),
      bullet('Cross-source critical divergence → recorded but does not block composite write. Visible in v_recent_divergence_streaks for triage.'),

      // 7. Frontend file map
      h1('7. Frontend File Map'),
      bullet('src/app/api/ — public + internal API routes (transparency, trends, glossary, research, pulse, cron, layoffs, social-feed, history, admin).'),
      bullet('src/app/(public)/ — public pages (home, country pages, glossary, research, transparency).'),
      bullet('src/i18n/ — next-intl config (LOCALES, DEFAULT_LOCALE) + messages/en.json + messages/tr.json.'),
      bullet('src/lib/indicators/ — orchestrator, types, composeMetaIndex, sources/ (one file per adapter).'),
      bullet('src/middleware.ts — next-intl as-needed prefix.'),
      bullet('supabase/migrations/ — 18 numbered migrations.'),
      bullet('scripts/ — content_audit.sql, content_batch_fill_runbook.md, fire_content_batches.sh, doc generators.'),

      h1('8. Future Work'),
      bullet('UI sprint: country pages, comparison views, transparency surface, sparklines on indicator cards.'),
      bullet('Phase 2 locales: de, ja, es, fr, pt-br shipping content via PD scheduler.'),
      bullet('Indicator extension: OECD Better Life integration (life_satisfaction, work_life_balance) once SDMX endpoint stabilizes.'),
      bullet('Trend alerting: webhook fanout when |delta_30d| crosses a threshold for paying API consumers.'),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = process.argv[2] || '/tmp/TechArch_v3.docx';
  fs.writeFileSync(out, buffer);
  console.log('Wrote', out, buffer.length, 'bytes');
});
