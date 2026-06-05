-- Migration 020: Expand pulse-active country set for multi-locale content
--
-- Original (migration 008): US, GB, DE, TR, JP — five English-leaning markets.
-- This migration adds the next-priority markets that map to our scaffolded
-- locales (DE/de, FR/fr, ES/es, PT/pt-br via BR, IT/it via IT, NL/nl via NL).
--
-- After this migration the per-country Pulse scheduler covers 10 markets ×
-- N locales. With THI_PULSE_LOCALES=en,tr,de,fr,es,pt-br on PD, that's up
-- to 60 Pulse pairs / week — though most countries care primarily about
-- their own locale (DE/de, FR/fr, etc.), so realistic publish count is
-- closer to 20 unique pairs/week.

UPDATE countries SET pulse_active = true
  WHERE code IN ('US', 'GB', 'DE', 'TR', 'JP', 'FR', 'ES', 'IT', 'NL', 'BR');

-- Sanity verify post-migration:
--   SELECT code, name, pulse_active FROM countries
--   WHERE pulse_active = true ORDER BY code;
