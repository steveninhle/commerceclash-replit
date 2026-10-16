-- Check cohorts and their classes
SELECT
  c.id as cohort_id,
  c.name as cohort_name,
  COUNT(rc.id) as actual_class_count,
  c.total_classes as stored_class_count
FROM cohorts c
LEFT JOIN renamedclass rc ON rc.cohort_id = c.id
GROUP BY c.id, c.name, c.total_classes
ORDER BY c.created_at DESC;

-- Check classes without cohort
SELECT
  id,
  name,
  cohort_id,
  created_at
FROM renamedclass
WHERE cohort_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check all classes with cohort
SELECT
  rc.id,
  rc.name as class_name,
  rc.cohort_id,
  c.name as cohort_name
FROM renamedclass rc
LEFT JOIN cohorts c ON c.id = rc.cohort_id
ORDER BY rc.created_at DESC
LIMIT 20;
