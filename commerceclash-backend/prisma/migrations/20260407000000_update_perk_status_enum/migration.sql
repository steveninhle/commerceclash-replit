-- Migration: update perk_status enum
-- Old values: request, pending, approved, denied
-- New values: pending, approved, denied, used
--
-- Strategy (Postgres doesn't support DROP VALUE on enums):
--   1. Rename the old type out of the way
--   2. Create the new type with the desired values
--   3. Migrate the column (request → pending)
--   4. Drop the old type

-- Step 1: rename old enum
ALTER TYPE "perk_status" RENAME TO "perk_status_old";

-- Step 2: create new enum
CREATE TYPE "perk_status" AS ENUM ('pending', 'approved', 'denied', 'used');

-- Step 3: migrate column — cast via text, mapping 'request' → 'pending'
ALTER TABLE "student_perks"
  ALTER COLUMN "perk_status" DROP DEFAULT,
  ALTER COLUMN "perk_status" TYPE "perk_status"
    USING (
      CASE "perk_status"::text
        WHEN 'request' THEN 'pending'::"perk_status"
        ELSE "perk_status"::text::"perk_status"
      END
    ),
  ALTER COLUMN "perk_status" SET DEFAULT 'pending'::"perk_status";

-- Step 4: drop old enum
DROP TYPE "perk_status_old";
