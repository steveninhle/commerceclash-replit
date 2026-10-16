-- AlterTable: Add missing columns to cohorts that were in schema but not initial migration
ALTER TABLE "cohorts"
  ADD COLUMN IF NOT EXISTS "program_name" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "level"        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "cover_image"  TEXT,
  ADD COLUMN IF NOT EXISTS "tags"         JSONB NOT NULL DEFAULT '[]';
