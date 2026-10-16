-- Backfill script for cohorts.timezone — review before running.
--
-- Context: generateClasses() now converts each cohort_schedules row's
-- "HH:MM" wall-clock time to UTC using cohorts.timezone. Cohorts created
-- before timezone capture was added have timezone = NULL, which makes
-- generateClasses() fall back to DEFAULT_COHORT_TIMEZONE (see
-- schedule-occurrence.util.ts / .env.example). That fallback is safe but
-- generic; if you know the real timezone each of these cohorts' classes
-- were actually run in, backfill it explicitly instead of relying on the
-- fallback.
--
-- 1. See which cohorts are affected and how many classes each has already
--    generated (those classes' start_time will NOT be touched by this
--    script — only future "Generate Classes" runs are affected by the
--    timezone value going forward):
SELECT c.id, c.name, c.teacher_id, c.created_at, count(cl.id) AS existing_classes
FROM cohorts c
LEFT JOIN class cl ON cl.cohort_id = c.id
WHERE c.timezone IS NULL
GROUP BY c.id
ORDER BY c.created_at;

-- 2. Backfill every NULL-timezone cohort to a single default zone. Replace
--    'Asia/Ho_Chi_Minh' with whatever DEFAULT_COHORT_TIMEZONE you configured
--    (or the actual zone for your user base) before running.
-- UPDATE cohorts
-- SET timezone = 'Asia/Ho_Chi_Minh'
-- WHERE timezone IS NULL;

-- 3. If specific cohorts need a different zone (e.g. a teacher in a
--    different region), update them individually instead of relying on the
--    blanket UPDATE above, e.g.:
-- UPDATE cohorts SET timezone = 'America/New_York' WHERE id = '<cohort-id>';
