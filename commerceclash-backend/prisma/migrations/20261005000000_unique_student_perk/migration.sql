BEGIN;
LOCK TABLE student_perks IN ACCESS EXCLUSIVE MODE;

-- Preserve usage history and the most restrictive usage state when merging
-- duplicates created by the old find-then-create provisioning path.
CREATE TEMP TABLE perk_duplicates ON COMMIT DROP AS
SELECT id, FIRST_VALUE(id) OVER (
  PARTITION BY enrollment_id, perk_id
  ORDER BY is_used DESC, next_available_at DESC NULLS LAST, created_at, id
) AS keeper
FROM student_perks;

UPDATE perk_usage AS usage
SET student_perk_id = duplicates.keeper
FROM perk_duplicates AS duplicates
WHERE usage.student_perk_id = duplicates.id AND duplicates.id <> duplicates.keeper;

UPDATE student_perks AS keeper
SET is_unlocked = merged.is_unlocked,
    last_used_at = merged.last_used_at,
    next_available_at = merged.next_available_at
FROM (
  SELECT d.keeper, BOOL_OR(p.is_unlocked) AS is_unlocked,
         MAX(p.last_used_at) AS last_used_at, MAX(p.next_available_at) AS next_available_at
  FROM perk_duplicates d JOIN student_perks p ON p.id = d.id
  GROUP BY d.keeper
) merged
WHERE keeper.id = merged.keeper;

DELETE FROM student_perks p USING perk_duplicates d
WHERE p.id = d.id AND d.id <> d.keeper;

CREATE UNIQUE INDEX student_perks_enrollment_id_perk_id_key
ON student_perks(enrollment_id, perk_id);
COMMIT;
