/**
 * Generate TheHumanIndex_PRD_v3.3.docx
 *
 * Reflects backend state as of 2026-06-05:
 *   - 5-meta-index framework (Economic, Social, Mental, Technological, Environmental)
 *   - 25 active countries × 25 indicators × 6 production adapters
 *   - Per-country content factories (Pulse, Glossary, Research)
 *   - Cross-source validation as transparency moat
 *   - 7 public read API endpoints
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

const p = (text, opts = {}) => new Paragraph({
  ...opts,
  children: Array.isArray(text)
    ? text.map(t => typeof t === 'string' ? new TextRun(t) : t)
    : [new TextRun(text)],
});

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [new TextRun(text)],
});

const cell = (text, opts = {}) => new TableCell({
  borders,
  width: { size: opts.w || 4680, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    children: [new TextRun({ text, bold: opts.bold || false })],
  })],
});

const tbl = (cols, rows) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: cols,
  rows,
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
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      // ── Title block ──
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'THE HUMAN INDEX', bold: true, size: 40 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Civilizational Stress Index', italics: true, size: 24 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Product Requirements Document', size: 22 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Platform: thehumanindex.org', size: 22 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Social Brand: @humanerror', size: 22 }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Version 3.3 — June 2026', size: 22, bold: true }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: 'Prepared by: Umay.dev', italics: true, size: 20 }),
      ]}),
      p(''),

      // ── 1. Executive Summary ──
      h1('1. Executive Summary'),
      p('The Human Index is an automated, data-driven platform that algorithmically measures civilizational stress across 25 countries through 25 indicators organized into 5 meta-indexes: Economic, Social, Mental, Technological, and Environmental. The platform is live at thehumanindex.org with a Vercel cron refreshing scores throughout the day, six production data adapters (Eurostat, World Bank, IMF, OECD, NASA/Berkeley, Reference Seed), and a content factory that produces per-country Pulse articles, glossary entries, and long-form research — currently shipping in English and Turkish, with the i18n routing scaffold ready to extend to eight additional locales.'),
      p('Version 3.3 marks the architectural pivot from the original US-only, 7-domain framework (v3.2) to a globally-scoped 5-meta-index framework. The transition is complete on the backend: 25 indicators × 25 countries × 6 adapters running, snapshot-based daily history, cross-source validation persisting every divergence to a dedicated table, and seven public read-only API endpoints powering frontend content surfaces. The user-facing UI sprint is the next phase, deliberately deferred until the data substrate proved out at scale.'),
      p('The Human Index sells credibility as its primary moat. Every published stress score is drillable: readers can hit /api/transparency/[country] and see which adapter produced which raw value at which reference date, and how cross-source spreads compare to threshold-based warnings. The Trends API exposes 30- and 90-day historical change for any (country, indicator) pair. This radical transparency is what differentiates The Human Index from index aggregators that publish single numbers without methodology.'),

      // ── 2. Product Architecture ──
      h1('2. Product Architecture'),

      h2('2.1 Five Meta-Index Framework'),
      p('Every indicator belongs to exactly one of five meta-indexes. The composite stress score for a country is a weighted aggregate of its five meta-index scores. Default weights bias toward Economic stress (0.25) while keeping the remaining four balanced (Social 0.20, Mental 0.20, Technological 0.20, Environmental 0.15).'),

      tbl([3120, 6240], [
        new TableRow({ children: [
          cell('Meta-Index', { bold: true, fill: 'E8EEF4', w: 3120 }),
          cell('Indicators (25 total)', { bold: true, fill: 'E8EEF4', w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Economic (8)', { w: 3120 }),
          cell('unemployment_rate, youth_unemployment_rate, gini_index, housing_affordability, inflation_rate, gdp_growth_rate, gov_debt_pct_gdp, age_dependency_ratio', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Social (6)', { w: 3120 }),
          cell('fertility_rate, divorce_rate, social_trust, loneliness, adolescent_fertility_rate, homicide_rate', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Mental (8)', { w: 3120 }),
          cell('burnout, depression_prevalence, anxiety_prevalence, suicide_rate, screen_time, life_expectancy, mortality_rate_under5, alcohol_consumption_per_capita', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Technological (3)', { w: 3120 }),
          cell('ai_job_anxiety, digital_addiction, automation_exposure', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Environmental (5)', { w: 3120 }),
          cell('water_stress, air_pollution, temperature_anomaly, co2_per_capita, renewable_energy_pct', { w: 6240 }),
        ]}),
      ]),

      h2('2.2 Country Coverage'),
      p('25 active countries spanning every populated continent. Inclusion criteria: reliable data accessibility through at least two production adapters, market relevance (English-speaking, German, Japanese, Spanish, Portuguese, Turkish, or Indian audiences), and per-capita GDP diversity to ensure the framework discriminates rather than just ranking by development.'),
      p('Active: US, CA, MX, GB, DE, FR, ES, IT, NL, SE, NO, PL, TR, CH, JP, KR, IN, SG, AU, NZ, BR, AR, ZA, IL, AE. Pulse-active (per-country weekly article): US, GB, DE, TR, JP. Locales currently shipping content: en, tr. i18n routing scaffold supports 10 locales (en, tr, de, es, fr, ja, pt-br, pl, it, nl).'),

      h2('2.3 Score Bands'),
      p('Composite scores are continuous 0-100 values but always communicated as bands. This is editorial: the platform does not claim decimal precision it cannot defend. Current bands: Low (0-25), Moderate (26-40), Elevated (41-60), High (61-80), Critical (81-100).'),

      h2('2.4 Confidence Tiers'),
      p('Every indicator value carries a confidence tier inherited from its data source. Verified means the value came from an official government or international filing (SEC EDGAR, WARN notices, Eurostat, World Bank, IMF, NASA, WHO). Reported means it came from established journalism or research reports (Reuters, Gallup, OECD surveys). Rumored means it came from social media or unverified sources (Reddit threads). The composite score weights verified sources more heavily, and rumored signals are surfaced as separate badges in the UI rather than blended into the main number.'),

      // ── 3. Communication & Content Standards ──
      h1('3. Communication & Content Standards'),

      h2('3.1 Tone and Voice'),
      p('Concerned but measured. Specific not vague. Data-anchored not editorial. Never alarmist, never reassuring. Sentence-level register matches Reuters or The Economist: factual claims paired with the specific number and the reference date.'),

      h2('3.2 Localization'),
      p('Localization is not translation. A Pulse for Germany in English is written for a global English reader interested in Germany — it leads with Germany-specific stress drivers (fertility collapse, energy transition, aging) rather than generic civilizational framing. A Pulse for Germany in Turkish is written for a Turkish reader who follows German economic news and wants context. Same country, different framing, different headline, different evidence emphasis. The PD content factory enforces this with locale-specific instruction templates passed to Claude.'),

      h2('3.3 Content Surfaces'),
      tbl([2400, 6960], [
        new TableRow({ children: [
          cell('Surface', { bold: true, fill: 'E8EEF4', w: 2400 }),
          cell('Cadence and locale strategy', { bold: true, fill: 'E8EEF4', w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Pulse', { w: 2400 }),
          cell('Weekly per pulse-active country × locale. Composite score plus 4-paragraph commentary anchored to that week\'s biggest movements.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Glossary', { w: 2400 }),
          cell('33 priority terms × country × locale. Each entry is a 400-800 word article with related-indicator and related-meta-index linkage. SERP zenginleştirme katmanı.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Research', { w: 2400 }),
          cell('12 topic templates × country × locale. Long-form 1,500-2,500 word articles tied to specific indicator clusters (AI displacement outlook, demographic decline, mental-health drift, etc.).', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Social Feed', { w: 2400 }),
          cell('Reddit + news ingestion, Claude-enriched with relevance score + why-matters explanation. Updates every 4 hours.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Corporate Layoffs', { w: 2400 }),
          cell('17 RSS feeds + SEC EDGAR + CA WARN, tiered by confidence (verified/reported/rumored). Per-country attribution.', { w: 6960 }),
        ]}),
      ]),

      // ── 4. Data Pipeline & Sources ──
      h1('4. Data Pipeline & Sources'),

      h2('4.1 Six Production Adapters'),
      tbl([2400, 6960], [
        new TableRow({ children: [
          cell('Adapter', { bold: true, fill: 'E8EEF4', w: 2400 }),
          cell('Indicators (and country coverage)', { bold: true, fill: 'E8EEF4', w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Eurostat', { w: 2400 }),
          cell('unemployment_rate, youth_unemployment_rate, fertility_rate, gini_index across 11 EU+ countries (fresher than World Bank for EU)', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('World Bank', { w: 2400 }),
          cell('12 indicators × 25 countries (unemployment + youth, gini, fertility, suicide, inflation, GDP growth, life expectancy, gov debt, CO2/capita, mortality under-5, renewable energy share, alcohol, age dependency, adolescent fertility, homicide)', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('IMF Data Mapper', { w: 2400 }),
          cell('Registered for inflation and unemployment cross-checking. Currently unreachable from Vercel runtime (network restriction); kept in adapter list for future fallback when restored.', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('OECD Housing', { w: 2400 }),
          cell('housing_affordability index, 25 countries (annual seed)', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Social Feed Computed', { w: 2400 }),
          cell('ai_job_anxiety computed from social_feed_curated relevance scores (Reddit + news enrichment)', { w: 6960 }),
        ]}),
        new TableRow({ children: [
          cell('Reference Seed', { w: 2400 }),
          cell('11 indicators bundled as annual seed: water_stress (WRI Aqueduct), air_pollution (WHO), burnout (Gallup), divorce, social_trust (WVS), loneliness, screen_time, digital_addiction, depression/anxiety (IHME GBD 2021), temperature_anomaly (Berkeley Earth per-country), automation_exposure (McKinsey 2023)', { w: 6960 }),
        ]}),
      ]),

      h2('4.2 Cross-Source Validation'),
      p('When two or more adapters report a value for the same (country, indicator), the orchestrator computes a divergence percentage and classifies it as ok, warning, or critical against configurable thresholds. Every such event persists to the cross_source_validations table (introduced in migration 017). A view tracks divergence streaks — pairs that flag warnings on more than two of their last ten runs, surfacing methodology disputes worth documenting publicly.'),
      p('Current state at the time of this revision: about 40 cross-checks per cron run, ~10 percent flag a warning (mostly WB versus Eurostat on EU unemployment where reference periods differ), zero critical events. The divergence data feeds the public /api/transparency/[country] endpoint that lets any reader audit how a country\'s scores were assembled.'),

      h2('4.3 Snapshot System'),
      p('Migration 018 introduced indicator_snapshots: one upsert per (country, indicator, day). The cron writes today\'s primary value on every run, but the UNIQUE constraint on (snapshot_date, country_code, indicator_id) collapses multiple same-day refreshes to a single daily row. Two views — v_indicator_30d_change and v_composite_30d_change — compute month-over-month deltas. The public /api/trends/[country]/[indicator] endpoint returns up to 90 days of series plus latest/30d-ago/90d-ago anchors with absolute and percentage changes.'),

      h2('4.4 Public Read API Surface'),
      tbl([4200, 5160], [
        new TableRow({ children: [
          cell('Endpoint', { bold: true, fill: 'E8EEF4', w: 4200 }),
          cell('Purpose', { bold: true, fill: 'E8EEF4', w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/transparency/[country]', { w: 4200 }),
          cell('Full sourcing audit per country: every adapter\'s reading for every indicator + divergence streak metadata.', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/trends/[country]/[indicator]', { w: 4200 }),
          cell('Up to 90-day daily history + 30-/90-day change summary for one (country, indicator) pair.', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/glossary', { w: 4200 }),
          cell('Glossary listing with filters (locale, country, q, meta, indicator).', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/glossary/[slug]', { w: 4200 }),
          cell('Single glossary entry with body markdown and hydrated related terms.', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/research', { w: 4200 }),
          cell('Research article listing with topic/meta/country filters.', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/research/[slug]', { w: 4200 }),
          cell('Single article with full body markdown + data snapshot used as evidence.', { w: 5160 }),
        ]}),
        new TableRow({ children: [
          cell('GET /api/pulse (+ /[country]/[slug])', { w: 4200 }),
          cell('Pulse list (cross-country, optionally "latest per country") and single Pulse reader.', { w: 5160 }),
        ]}),
      ]),

      // ── 5. Revenue Model ──
      h1('5. Revenue Model'),
      p('Free reading layer drives audience growth. Two paid surfaces underwrite operations:'),
      bullet('Newsletter (free + paid tiers). Free: weekly global Pulse summary. Paid ($9/month): per-country deep dives, cross-source methodology notes, early access to research articles, downloadable indicator CSVs.'),
      bullet('API access for researchers, journalists, and policy shops. Tiered keys with rate limits. Public endpoints stay free for read; bulk historical access and per-indicator alert webhooks are paid.'),
      p('Affiliate links to physical books referenced in research articles and a small Buy Me a Coffee tier round out incidental revenue. No advertising — the credibility moat depends on no advertiser influence over published scores.'),

      // ── 6. Phase Plan ──
      h1('6. Phase Plan'),

      h3('Phase 1 (Complete) — US-only MVP (v1, v2, v3.0)'),
      bullet('Seven-domain US framework live. Daily Vercel cron. Public Pulse + social feed.'),

      h3('Phase 2 (Complete) — Credibility infrastructure (v3.1, v3.2)'),
      bullet('Per-source health table + public /data-sources page. Confidence tiers for layoff events. Cross-source divergence detection. Editorial validation on Pulse before publish.'),

      h3('Phase 3 (Complete) — Global pivot (v3.3 backend)'),
      bullet('25 countries × 25 indicators × 5 meta-indexes. Six adapters in production. Per-country content factory. Cross-source validations persisted to dedicated table. Indicator snapshots + trend API. Public read APIs. PD per-country pulse manual batch endpoint.'),

      h3('Phase 4 (Next) — Frontend UI sprint'),
      bullet('Country selector + 5 meta-index display per country. Per-country Pulse pages. Glossary listing + reader. Research index + reader. Transparency page consuming /api/transparency. Trend sparklines on indicator cards.'),
      bullet('Locale routing live across 10 locales. Server-rendered with ISR for SEO. JSON-LD structured data for Article and Dataset schemas.'),

      h3('Phase 5 — Newsletter and growth'),
      bullet('Newsletter signup at thehumanindex.org/subscribe. Weekly digest assembled by PD. Paid tier launched in Q3 2026.'),

      // ── 7. Success Metrics ──
      h1('7. Success Metrics'),
      tbl([3120, 6240], [
        new TableRow({ children: [
          cell('Metric', { bold: true, fill: 'E8EEF4', w: 3120 }),
          cell('Current state / target', { bold: true, fill: 'E8EEF4', w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Indicator coverage', { w: 3120 }),
          cell('25 / 25 target indicators active. Snapshot density: ~735 daily snapshots = ~98% of 25×25 matrix.', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Country coverage', { w: 3120 }),
          cell('25 / 25 active. Pulse-active subset: 5 countries × 2 locales = 10 Pulse pairs/week.', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Cross-source validations', { w: 3120 }),
          cell('~40 checks/run; ~10% warnings, 0 critical. Target: ≤15% warnings sustained.', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Content stock (post-J2 batch)', { w: 3120 }),
          cell('Glossary: ~85 entries (target 200 by end Q3 2026). Research: ~7 articles (target 30). Pulse: ~17 entries (target ≥12 per locale by Q3).', { w: 6240 }),
        ]}),
        new TableRow({ children: [
          cell('Source health uptime', { w: 3120 }),
          cell('Eurostat ok, World Bank ok, OECD ok, Reference Seed ok, IMF degraded (Vercel network). Target: ≥4/6 adapters ok per run.', { w: 6240 }),
        ]}),
      ]),

      // ── 8. Risk Analysis ──
      h1('8. Risk Analysis'),
      h3('R1. Data source license drift'),
      p('Several sources (notably OWID for depression, IMF Vercel reachability) have changed access terms or stopped responding during development. Mitigation: every adapter is independent and can be replaced without orchestrator changes; reference-seed adapter holds annual fallback values that the cron can serve when live sources fail.'),

      h3('R2. Claude CLI rate limits during batch fills'),
      p('Manual batch fills issue 1-15 Claude CLI calls back-to-back. Hitting Anthropic rate limits would stall the factory. Mitigation: batches run sequentially (not parallel), per-run cap of 8 entries, retry-on-timeout pattern.'),

      h3('R3. Composite over-weighting'),
      p('Default meta-index weights are an opinionated editorial choice (Economic 0.25, others balanced). Critics may argue Environmental should weigh higher. Mitigation: weights are stored in indicators.weight_within_meta and DEFAULT_META_WEIGHTS — both configurable. The published composite is one view; the transparency API exposes per-meta scores so readers can recompute.'),

      h3('R4. Per-country Pulse validation failures'),
      p('Pulse articles occasionally fail validation (Claude leaves placeholder text). The validator catches this and demotes the pulse to draft. Risk: low-throughput countries (US-tr, JP-tr) may accumulate persistent drafts. Mitigation: PD\'s validation logs are reviewable; manual re-fire trivial. Monitor: validation_failed rate per (country, locale).'),

      h3('R5. Snapshot table growth'),
      p('At ~625 rows/day, indicator_snapshots accumulates ~228k rows/year. Acceptable. cross_source_validations adds ~14.6k/year. Total Supabase footprint manageable through 2027 on the current tier.'),

      // ── 9. Closing ──
      h1('9. Closing'),
      p('The Human Index v3.3 is a working civilizational stress instrument. The backend produces continuously refreshed scores for a quarter of the world\'s GDP-meaningful countries across the dimensions that actually correlate with human distress. The next 60 days will turn that substrate into a public experience: country pages, comparison views, methodology disclosures, and the localized content stock that makes the site useful to non-English readers from day one.'),
      p('What remains constant from v3.0: the editorial bar. Every published number is defensible. Every published article is anchored to a data snapshot. Every cross-source disagreement is logged. The Human Index does not guess.'),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const out = process.argv[2] || '/tmp/PRD_v3.3.docx';
  fs.writeFileSync(out, buffer);
  console.log('Wrote', out, buffer.length, 'bytes');
});
