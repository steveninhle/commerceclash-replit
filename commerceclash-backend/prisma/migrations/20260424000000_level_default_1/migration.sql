-- Change default value of level in enrolled_students from 0 to 1
ALTER TABLE "enrolled_students" ALTER COLUMN "level" SET DEFAULT 1;

-- Fix existing rows that have level = 0 (set them to 1)
UPDATE "enrolled_students" SET "level" = 1 WHERE "level" = 0 OR "level" IS NULL;
