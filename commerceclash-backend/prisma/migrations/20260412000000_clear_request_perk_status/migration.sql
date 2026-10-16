-- Migration: clear leftover 'request' perk_status values
-- The 'request' value was removed from the perk_status enum in migration 20260407,
-- but that migration was never deployed to this DB, leaving rows with perk_status = 'request'
-- that the Prisma client can no longer deserialize.
-- Fix: cast via text to safely null-out those rows without touching the enum type itself.

UPDATE "student_perks"
SET "perk_status" = NULL
WHERE "perk_status"::text = 'request';
