-- Cleanup duplicate per-country pulses produced by the locale_expansion
-- batch overlapping with the curl-loop retry. Two pulses for the same
-- (country_code, locale) with different slugs but produced minutes apart.
--
-- Strategy: keep the latest published_at for each (country, locale, type).
-- The earlier one stays in the database but its slug is rewritten so URLs
-- don't conflict. Or simply delete the older one.

-- Step 1: identify duplicates (run first to inspect)
SELECT country_code, locale, type, COUNT(*) AS n,
       ARRAY_AGG(slug ORDER BY published_at DESC) AS slugs,
       ARRAY_AGG(title ORDER BY published_at DESC) AS titles
FROM commentary
WHERE published_at > now() - interval '6 hours'
GROUP BY country_code, locale, type
HAVING COUNT(*) > 1;

-- Step 2: keep latest, delete older duplicates
-- (Only run after inspecting Step 1 output)
DELETE FROM commentary c
WHERE c.id IN (
  SELECT id FROM (
    SELECT id, country_code, locale, type, published_at,
           ROW_NUMBER() OVER (PARTITION BY country_code, locale, type
                              ORDER BY published_at DESC) AS rn
    FROM commentary
    WHERE published_at > now() - interval '6 hours'
  ) ranked
  WHERE rn > 1
);

-- Step 3: confirm — no duplicate pairs remain
SELECT country_code, locale, type, COUNT(*) AS n
FROM commentary
WHERE published_at > now() - interval '6 hours'
GROUP BY country_code, locale, type
HAVING COUNT(*) > 1;
