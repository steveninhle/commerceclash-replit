CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "cohorts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255),
  "description" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'active',
  "start_date" TIMESTAMPTZ,
  "end_date" TIMESTAMPTZ,
  "timezone" VARCHAR(100),
  "teacher_id" UUID,
  "program_name" VARCHAR(255),
  "level" VARCHAR(100),
  "max_students" INTEGER NOT NULL DEFAULT 0,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "total_classes" INTEGER NOT NULL DEFAULT 0,
  "total_students" INTEGER NOT NULL DEFAULT 0,
  "total_sessions" INTEGER NOT NULL DEFAULT 8,
  "current_week" INTEGER NOT NULL DEFAULT 0,
  "schedule" JSONB NOT NULL DEFAULT '{}',
  "cover_image" TEXT,
  "tags" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "archived_at" TIMESTAMPTZ,
  CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "cohorts"
  ADD COLUMN IF NOT EXISTS "program_name" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "level" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "cover_image" TEXT,
  ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "total_sessions" INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "current_week" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "schedule" JSONB NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_teacher_id_fkey'
  ) THEN
    ALTER TABLE "cohorts"
      ADD CONSTRAINT "cohorts_teacher_id_fkey"
      FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cohorts_slug_key" ON "cohorts"("slug");
CREATE INDEX IF NOT EXISTS "idx_cohorts_status" ON "cohorts"("status");
CREATE INDEX IF NOT EXISTS "idx_cohorts_start_date" ON "cohorts"("start_date");
CREATE INDEX IF NOT EXISTS "idx_cohorts_teacher_id" ON "cohorts"("teacher_id");

ALTER TABLE "class" ADD COLUMN IF NOT EXISTS "cohort_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'class_cohort_id_fkey'
  ) THEN
    ALTER TABLE "class"
      ADD CONSTRAINT "class_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_class_cohort" ON "class"("cohort_id");

CREATE TABLE IF NOT EXISTS "cohort_students" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cohort_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "is_new" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "current_xp" INTEGER NOT NULL DEFAULT 0,
  "current_level" INTEGER NOT NULL DEFAULT 1,
  "current_market_share" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "perks" JSONB NOT NULL DEFAULT '[]',
  "skill_points" JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT "cohort_students_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "cohort_students"
  ADD COLUMN IF NOT EXISTS "is_new" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "current_xp" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "current_level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "current_market_share" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "perks" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "skill_points" JSONB NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_students_cohort_id_fkey'
  ) THEN
    ALTER TABLE "cohort_students"
      ADD CONSTRAINT "cohort_students_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_students_student_id_fkey'
  ) THEN
    ALTER TABLE "cohort_students"
      ADD CONSTRAINT "cohort_students_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cohort_students_cohort_id_student_id_key"
  ON "cohort_students"("cohort_id", "student_id");
CREATE INDEX IF NOT EXISTS "idx_cohort_students_cohort" ON "cohort_students"("cohort_id");
CREATE INDEX IF NOT EXISTS "idx_cohort_students_student" ON "cohort_students"("student_id");

CREATE TABLE IF NOT EXISTS "cohort_progression" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cohort_id" UUID NOT NULL,
  "week_number" INTEGER NOT NULL,
  "total_xp" INTEGER NOT NULL DEFAULT 0,
  "average_level" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "total_market_share" INTEGER NOT NULL DEFAULT 0,
  "completion_rate" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  "active_students" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "cohort_progression_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_progression_cohort_id_fkey'
  ) THEN
    ALTER TABLE "cohort_progression"
      ADD CONSTRAINT "cohort_progression_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cohort_progression_cohort_id_week_number_key"
  ON "cohort_progression"("cohort_id", "week_number");
CREATE INDEX IF NOT EXISTS "idx_cohort_progression_cohort" ON "cohort_progression"("cohort_id");
CREATE INDEX IF NOT EXISTS "idx_cohort_progression_week" ON "cohort_progression"("week_number");

CREATE TABLE IF NOT EXISTS "cohort_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cohort_id" UUID NOT NULL,
  "week_number" INTEGER NOT NULL,
  "unlocked_at" TIMESTAMPTZ,
  "locked_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "cohort_sessions_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_sessions_cohort_id_fkey'
  ) THEN
    ALTER TABLE "cohort_sessions"
      ADD CONSTRAINT "cohort_sessions_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "cohort_sessions_cohort_id_week_number_key"
  ON "cohort_sessions"("cohort_id", "week_number");
CREATE INDEX IF NOT EXISTS "idx_cohort_sessions_cohort" ON "cohort_sessions"("cohort_id");

CREATE TABLE IF NOT EXISTS "cohort_materials" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cohort_id" UUID NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "uploaded_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "cohort_materials_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_materials_cohort_id_fkey'
  ) THEN
    ALTER TABLE "cohort_materials"
      ADD CONSTRAINT "cohort_materials_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_materials_uploaded_by_fkey'
  ) THEN
    ALTER TABLE "cohort_materials"
      ADD CONSTRAINT "cohort_materials_uploaded_by_fkey"
      FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_cohort_materials_cohort" ON "cohort_materials"("cohort_id");

CREATE TABLE IF NOT EXISTS "cohort_recordings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "cohort_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "recording_url" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "cohort_recordings_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cohort_recordings_cohort_id_fkey'
  ) THEN
    ALTER TABLE "cohort_recordings"
      ADD CONSTRAINT "cohort_recordings_cohort_id_fkey"
      FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_cohort_recordings_cohort" ON "cohort_recordings"("cohort_id");

CREATE TABLE IF NOT EXISTS "stripe_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "stripe_event_id" TEXT NOT NULL,
  "session_id" TEXT,
  "event_type" TEXT NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "payload" JSONB,
  CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stripe_events" ADD COLUMN IF NOT EXISTS "session_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "stripe_events_stripe_event_id_key"
  ON "stripe_events"("stripe_event_id");
CREATE INDEX IF NOT EXISTS "stripe_events_session_id_idx" ON "stripe_events"("session_id");

CREATE TABLE IF NOT EXISTS "pending_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "encrypted_password" TEXT NOT NULL,
  "cohort_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_session_id_key"
  ON "pending_registrations"("session_id");
