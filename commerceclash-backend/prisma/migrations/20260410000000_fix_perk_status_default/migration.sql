-- Migration: fix perk_status default
-- The perk_status column had @default(pending) which caused every newly created
-- student_perk row to start as "pending" — making it look like the student had
-- already sent a request before clicking anything.
-- Fix: remove the default so new rows start with NULL (no status).
-- Also clear stale "pending" rows where the student never actually requested
-- (is_approved = false and is_used = false).

-- Step 1: clear stale pending status on perks that were never actually requested
UPDATE "student_perks"
SET "perk_status" = NULL
WHERE "perk_status" = 'pending'
  AND "is_approved" = false
  AND "is_used" = false;

-- Step 2: remove the column default so new rows start with NULL
ALTER TABLE "student_perks"
  ALTER COLUMN "perk_status" DROP DEFAULT;
