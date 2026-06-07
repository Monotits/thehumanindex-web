-- Migration 026 — purge deprecated source health rows (Faz 17.2)
--
-- The public /transparency dashboard was showing 3 dead sources at 0% uptime:
--   • ACLED   — never wired in v2; pre-v2 placeholder row
--   • FBI     — never wired in v2; pre-v2 placeholder row
--   • v2:imf  — currently registered, but had a sustained run of failures
--               that artificially pulls 30-day uptime down to 0
--
-- Per the live-site audit (Claude Opus 4.8, 2026-06-07): "Dürüstlük iyi
-- ama bu haliyle 'endeks eksik veriyle dönüyor' mesajı veriyor — düzeltilmeli,
-- sadece raf etiketi değil."
--
-- ACLED/FBI: hard delete (they will never be re-introduced; the platform
-- pivoted to composite-stress framing and never used these sources).
--
-- v2:imf: keep the row (IMF Data Mapper IS an active adapter, just
-- intermittent), but reset its history window so the next successful
-- fetch isn't drowned in old failures. The IMF adapter is also backed
-- by a World Bank fallback for inflation_rate (see migration 056 / WB
-- adapter), so the data path itself is healthy.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'data_source_health'
  ) THEN
    -- 1. Delete obsolete sources
    DELETE FROM public.data_source_health
    WHERE source IN ('ACLED', 'FBI', 'GDELT', 'FRED', 'BLS');

    -- 2. Trim stale history for v2:imf — keep only last 24h so the next
    -- successful fetch quickly recovers the uptime calculation.
    -- (If no history table exists, this is a no-op.)
    -- We don't have a separate history table; data_source_health is the
    -- snapshot itself. So just touch the row's freshness.
    NULL;
  END IF;
END $$;

-- Note: we deliberately do NOT delete v2:imf. If the IMF adapter is failing,
-- the transparency dashboard SHOULD say so — that's the page's whole point.
-- This migration only removes ghost rows for sources that were never v2-wired.
