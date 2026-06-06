-- Migration 022: 2 CRITICAL indicator fixes (Audit Phase 2)
--
-- Fix 1: ai_job_anxiety — disable.
--
-- Phase 2 sanity sweep found that across all 25 countries the observed
-- value was identical (79.8) → normalized stress 99.7 for everyone.
-- Root cause: socialFeedComputed adapter aggregates one GLOBAL value
-- from the social feed and applies it to every country. This indicator
-- has zero per-country discriminating power.
--
-- We disable it pending a real per-country sentiment source. The
-- Technological meta-index drops to 3 indicators (digital_addiction,
-- screen_time, automation_exposure) — still meaningful.
--
-- Impact: every country's composite drops ~1-2 points (the +99.7 phantom
-- contribution goes away). The ranking stays roughly the same; the
-- composite simply becomes more honest.

UPDATE indicators SET active = false WHERE id = 'ai_job_anxiety';


-- Fix 2: inflation_rate — bound 15% → 80%.
--
-- Phase 2 audit found bound 2-15% too tight for hyperinflation regime
-- (TR 58%, AR 220% both clamping at stress=100, indistinguishable).
--
-- Phase 2 finding recommended high=30 but that math doesn't actually
-- differentiate TR from AR — both still clamp. We use high=80:
--
--   US     2.95% → (2.95-2) / 78  × 100 = 1.2 stress  (no change in interpretation)
--   DE     2.26% →                      = 0.3 stress
--   BR     ~5%   →                      = 3.8 stress
--   IN     5.7%  →                      = 4.7 stress
--   TR    58.5%  → (58.5-2) / 78 × 100 = 72.4 stress  (DISTINCT from AR)
--   AR   219.9%  → clamped              = 100 stress  (hyperinflation max)
--
-- TR composite gains ~1 point of inflation signal back (was 100, now 72.4
-- → contribution drop from 100 to 72.4 across 1/8 economic weight = 3.5
-- drop on economic meta = 0.88 drop on composite). AR composite stays
-- 100-clamped (correct — hyperinflation is hyperinflation).

UPDATE indicators SET normalize_high = 80 WHERE id = 'inflation_rate';


-- Sanity verify:
--   SELECT id, active, normalize_low, normalize_high FROM indicators
--   WHERE id IN ('ai_job_anxiety', 'inflation_rate');
