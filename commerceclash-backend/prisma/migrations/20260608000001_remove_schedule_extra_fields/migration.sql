-- AlterTable: remove end_time, meeting_link, passcode, is_active from cohort_schedules
ALTER TABLE "cohort_schedules" DROP COLUMN IF EXISTS "end_time";
ALTER TABLE "cohort_schedules" DROP COLUMN IF EXISTS "meeting_link";
ALTER TABLE "cohort_schedules" DROP COLUMN IF EXISTS "passcode";
ALTER TABLE "cohort_schedules" DROP COLUMN IF EXISTS "is_active";
