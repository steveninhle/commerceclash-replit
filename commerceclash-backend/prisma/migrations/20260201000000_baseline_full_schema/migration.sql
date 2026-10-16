-- Baseline migration: creates all tables built outside Prisma (directly in Supabase).
-- Uses IF NOT EXISTS / DO-EXCEPTION / ADD COLUMN IF NOT EXISTS guards everywhere
-- so this is a no-op on the production database while giving the shadow database
-- the full schema it needs to replay subsequent migrations successfully.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums (initial values — before any ALTER TYPE migrations) ───────────────

DO $$ BEGIN
  CREATE TYPE "perk_status" AS ENUM ('request', 'pending', 'approved', 'denied');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "quiz_room_status" AS ENUM ('waiting', 'question_active', 'showing_result', 'finished');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "task_score_level" AS ENUM ('WEAK', 'DEVELOPING', 'STRONG', 'ELITE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── roles ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "roles" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "name"       TEXT        NOT NULL,
  CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- ─── users ───────────────────────────────────────────────────────────────────
-- The init migration created a slim "user" table (singular).
-- The real application uses "users" (plural) with more columns.
-- On the shadow DB we rename "user" → "users" so the existing "user_pkey"
-- constraint is preserved and there is no name conflict.
-- On production "user" does not exist (it was never used), so the DO block
-- is a no-op and the CREATE TABLE IF NOT EXISTS below handles the table.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    ALTER TABLE "user" RENAME TO "users";
  END IF;
END $$;

-- Remove the legacy "metadata" column added by the init migration if it exists.
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "metadata";

-- Add columns that exist in the real schema but not in the init "user" table.
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "name"      TEXT;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "role_id"   UUID;

-- Fallback: create "users" from scratch if neither rename nor existing table applies.
-- Uses a distinct constraint name to avoid any lingering "user_pkey" conflict.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE "users" (
      "id"         UUID      NOT NULL,
      "email"      TEXT      NOT NULL,
      "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "name"       TEXT,
      "role_id"    UUID,
      "is_active"  BOOLEAN   NOT NULL DEFAULT true,
      CONSTRAINT "users_pk_baseline" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_role_id_fkey') THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "user_role_id_fkey"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION;
  END IF;
END $$;

-- ─── archtypes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "archtypes" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "title"       TEXT        NOT NULL,
  "description" TEXT,
  "difficulty"  SMALLINT    NOT NULL,
  "playstyle"   TEXT        NOT NULL,
  "risk"        SMALLINT    NOT NULL,
  "influence"   SMALLINT    NOT NULL,
  "growth"      SMALLINT    NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sub_title"   TEXT        NOT NULL DEFAULT '',
  CONSTRAINT "archtypes_pkey" PRIMARY KEY ("id")
);

-- ─── perk_types ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "perk_types" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "type"       TEXT        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "perk_types_pkey" PRIMARY KEY ("id")
);

-- ─── perks ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "perks" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "description"   TEXT,
  "is_coded"      BOOLEAN     NOT NULL,
  "is_repeatable" BOOLEAN     NOT NULL,
  "auto_approve"  BOOLEAN     NOT NULL,
  "perk_type"     UUID        NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "key"           TEXT        NOT NULL,
  "archtype_id"   UUID        NOT NULL,
  "title"         TEXT        NOT NULL,
  CONSTRAINT "perks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "perks_key_key" ON "perks"("key");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perks_archtype_id_fkey') THEN
    ALTER TABLE "perks" ADD CONSTRAINT "perks_archtype_id_fkey"
      FOREIGN KEY ("archtype_id") REFERENCES "archtypes"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perks_perk_type_fkey') THEN
    ALTER TABLE "perks" ADD CONSTRAINT "perks_perk_type_fkey"
      FOREIGN KEY ("perk_type") REFERENCES "perk_types"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── class ───────────────────────────────────────────────────────────────────
-- WITHOUT skill_locked  → added by 20260327000000_add_skill_locked_to_class
-- WITHOUT cohort_id     → added by 20260508000002_add_cohort_id_to_class

CREATE TABLE IF NOT EXISTS "class" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "meeting_id"       TEXT        NOT NULL,
  "name"             TEXT        NOT NULL,
  "meeting_link"     TEXT        NOT NULL,
  "passcode"         TEXT,
  "duration"         SMALLINT,
  "instructor_id"    UUID        NOT NULL,
  "allocated_points" SMALLINT    DEFAULT 10,
  "is_active"        BOOLEAN     NOT NULL DEFAULT false,
  "start_time"       TIMESTAMPTZ,
  "end_time"         TIMESTAMPTZ,
  CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_instructor_id_fkey') THEN
    ALTER TABLE "class" ADD CONSTRAINT "class_instructor_id_fkey"
      FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── enrolled_students (WITHOUT unique constraint — added by 20260422000000) ─

CREATE TABLE IF NOT EXISTS "enrolled_students" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "student_id"       UUID        NOT NULL,
  "class_id"         UUID        NOT NULL,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "available_points" SMALLINT    DEFAULT 10,
  "xp"               SMALLINT    DEFAULT 0,
  "level"            SMALLINT    DEFAULT 0,
  "archtype_id"      UUID,
  "market_share"     SMALLINT    DEFAULT 0,
  "is_cancelled"     BOOLEAN     DEFAULT false,
  "skill_unlocked"   BOOLEAN     DEFAULT true,
  "shifting_points"  SMALLINT    DEFAULT 0,
  "is_shifting"      BOOLEAN     DEFAULT false,
  CONSTRAINT "enrolled_students_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "enrolled_students_student_id_class_id_idx"
  ON "enrolled_students"("student_id", "class_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrolled_students_class_id_fkey') THEN
    ALTER TABLE "enrolled_students" ADD CONSTRAINT "enrolled_students_class_id_fkey"
      FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrolled_students_student_id_fkey') THEN
    ALTER TABLE "enrolled_students" ADD CONSTRAINT "enrolled_students_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrolled_students_archtype_id_fkey') THEN
    ALTER TABLE "enrolled_students" ADD CONSTRAINT "enrolled_students_archtype_id_fkey"
      FOREIGN KEY ("archtype_id") REFERENCES "archtypes"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── attributes ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "attributes" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "name"       TEXT        NOT NULL,
  "value"      SMALLINT    NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- ─── student_attributes ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "student_attributes" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "enrollment_id" UUID        NOT NULL,
  "attribute_id"  UUID        NOT NULL,
  "value"         SMALLINT    NOT NULL,
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "student_attributes_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_attributes_enrollment_id_fkey') THEN
    ALTER TABLE "student_attributes" ADD CONSTRAINT "student_attributes_enrollment_id_fkey"
      FOREIGN KEY ("enrollment_id") REFERENCES "enrolled_students"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_attributes_attribute_id_fkey') THEN
    ALTER TABLE "student_attributes" ADD CONSTRAINT "student_attributes_attribute_id_fkey"
      FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── student_perks ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "student_perks" (
  "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
  "enrollment_id"     UUID         NOT NULL,
  "perk_id"           UUID         NOT NULL,
  "is_unlocked"       BOOLEAN      NOT NULL DEFAULT false,
  "is_used"           BOOLEAN      NOT NULL DEFAULT false,
  "last_used_at"      TIMESTAMPTZ,
  "next_available_at" TIMESTAMPTZ,
  "updated_at"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "created_at"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "is_approved"       BOOLEAN      DEFAULT false,
  "perk_status"       "perk_status",
  CONSTRAINT "student_perks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "student_perks_enrollment_id_idx" ON "student_perks"("enrollment_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_perks_enrollment_id_fkey') THEN
    ALTER TABLE "student_perks" ADD CONSTRAINT "student_perks_enrollment_id_fkey"
      FOREIGN KEY ("enrollment_id") REFERENCES "enrolled_students"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_perks_perk_id_fkey') THEN
    ALTER TABLE "student_perks" ADD CONSTRAINT "student_perks_perk_id_fkey"
      FOREIGN KEY ("perk_id") REFERENCES "perks"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── perk_usage ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "perk_usage" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "student_perk_id" UUID        NOT NULL,
  "enrollment_id"   UUID        NOT NULL,
  "used_at"         TIMESTAMPTZ NOT NULL,
  "result_data"     JSON        NOT NULL,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "perk_usage_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perk_usage_student_perk_id_fkey') THEN
    ALTER TABLE "perk_usage" ADD CONSTRAINT "perk_usage_student_perk_id_fkey"
      FOREIGN KEY ("student_perk_id") REFERENCES "student_perks"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'perk_usage_enrollment_id_fkey') THEN
    ALTER TABLE "perk_usage" ADD CONSTRAINT "perk_usage_enrollment_id_fkey"
      FOREIGN KEY ("enrollment_id") REFERENCES "enrolled_students"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── class_tasks ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "class_tasks" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "class_id"         UUID        NOT NULL,
  "created_by"       UUID        NOT NULL,
  "title"            TEXT        NOT NULL,
  "phase"            TEXT        NOT NULL DEFAULT 'TASK PHASE',
  "mission_brief"    TEXT        NOT NULL,
  "objectives"       TEXT[]      NOT NULL,
  "requirements"     TEXT[]      NOT NULL,
  "preparation_time" SMALLINT    NOT NULL DEFAULT 5,
  "is_enabled"       BOOLEAN     NOT NULL DEFAULT false,
  "enabled_at"       TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "class_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "class_tasks_class_id_idx"   ON "class_tasks"("class_id");
CREATE INDEX IF NOT EXISTS "class_tasks_created_by_idx" ON "class_tasks"("created_by");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_tasks_class_id_fkey') THEN
    ALTER TABLE "class_tasks" ADD CONSTRAINT "class_tasks_class_id_fkey"
      FOREIGN KEY ("class_id") REFERENCES "class"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_tasks_created_by_fkey') THEN
    ALTER TABLE "class_tasks" ADD CONSTRAINT "class_tasks_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── task_evaluations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "task_evaluations" (
  "id"                     UUID               NOT NULL DEFAULT gen_random_uuid(),
  "task_id"                UUID               NOT NULL,
  "enrollment_id"          UUID               NOT NULL,
  "evaluated_by"           UUID               NOT NULL,
  "content_idea_score"     SMALLINT           NOT NULL,
  "organization_score"     SMALLINT           NOT NULL,
  "language_tone_score"    SMALLINT           NOT NULL,
  "delivery_clarity_score" SMALLINT           NOT NULL,
  "total_score"            SMALLINT           NOT NULL,
  "overall_result"         "task_score_level" NOT NULL,
  "xp_gained"              SMALLINT           NOT NULL,
  "evaluated_at"           TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  CONSTRAINT "task_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "task_evaluations_task_id_enrollment_id_key"
  ON "task_evaluations"("task_id", "enrollment_id");
CREATE INDEX IF NOT EXISTS "task_evaluations_enrollment_id_idx" ON "task_evaluations"("enrollment_id");
CREATE INDEX IF NOT EXISTS "task_evaluations_task_id_idx"        ON "task_evaluations"("task_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_evaluations_task_id_fkey') THEN
    ALTER TABLE "task_evaluations" ADD CONSTRAINT "task_evaluations_task_id_fkey"
      FOREIGN KEY ("task_id") REFERENCES "class_tasks"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_evaluations_enrollment_id_fkey') THEN
    ALTER TABLE "task_evaluations" ADD CONSTRAINT "task_evaluations_enrollment_id_fkey"
      FOREIGN KEY ("enrollment_id") REFERENCES "enrolled_students"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'task_evaluations_evaluated_by_fkey') THEN
    ALTER TABLE "task_evaluations" ADD CONSTRAINT "task_evaluations_evaluated_by_fkey"
      FOREIGN KEY ("evaluated_by") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── quizzes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "quizzes" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "title"           TEXT        NOT NULL,
  "description"     TEXT,
  "total_questions" INTEGER     NOT NULL DEFAULT 10,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- ─── questions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "questions" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"        UUID        NOT NULL,
  "question_text"  TEXT        NOT NULL,
  "question_order" INTEGER     NOT NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_quiz_id_fkey') THEN
    ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey"
      FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── options ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "options" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "question_id"  UUID        NOT NULL,
  "option_label" CHAR(1)     NOT NULL,
  "option_text"  TEXT        NOT NULL,
  "is_correct"   BOOLEAN     NOT NULL DEFAULT false,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'options_question_id_fkey') THEN
    ALTER TABLE "options" ADD CONSTRAINT "options_question_id_fkey"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── quiz_rooms ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "quiz_rooms" (
  "id"                          UUID               NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"                     UUID               NOT NULL,
  "class_id"                    UUID               NOT NULL,
  "status"                      "quiz_room_status" NOT NULL DEFAULT 'waiting',
  "current_question_order"      INTEGER            NOT NULL DEFAULT 0,
  "current_question_started_at" TIMESTAMPTZ,
  "current_question_ends_at"    TIMESTAMPTZ,
  "started_at"                  TIMESTAMPTZ,
  "ended_at"                    TIMESTAMPTZ,
  "created_at"                  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  CONSTRAINT "quiz_rooms_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_rooms_quiz_id_fkey') THEN
    ALTER TABLE "quiz_rooms" ADD CONSTRAINT "quiz_rooms_quiz_id_fkey"
      FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── room_participants ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "room_participants" (
  "id"                          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "room_id"                     UUID        NOT NULL,
  "student_id"                  UUID        NOT NULL,
  "total_score"                 INTEGER     NOT NULL DEFAULT 0,
  "correct_count"               INTEGER     NOT NULL DEFAULT 0,
  "cumulative_response_time_ms" INTEGER     NOT NULL DEFAULT 0,
  "last_correct_answered_at"    TIMESTAMPTZ,
  "joined_at"                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_room_participants" ON "room_participants"("room_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'room_participants_room_id_fkey') THEN
    ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_fkey"
      FOREIGN KEY ("room_id") REFERENCES "quiz_rooms"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'room_participants_student_id_fkey') THEN
    ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ─── student_answers ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "student_answers" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "room_id"          UUID        NOT NULL,
  "participant_id"   UUID        NOT NULL,
  "question_id"      UUID        NOT NULL,
  "option_id"        UUID        NOT NULL,
  "is_correct"       BOOLEAN     NOT NULL,
  "response_time_ms" INTEGER     NOT NULL,
  "score"            INTEGER     NOT NULL DEFAULT 0,
  "answered_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "student_answers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_one_answer_per_participant_question"
  ON "student_answers"("room_id", "participant_id", "question_id");
CREATE INDEX IF NOT EXISTS "idx_question_answers" ON "student_answers"("question_id");
CREATE INDEX IF NOT EXISTS "idx_room_answers"      ON "student_answers"("room_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_answers_option_id_fkey') THEN
    ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_option_id_fkey"
      FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_answers_participant_id_fkey') THEN
    ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_participant_id_fkey"
      FOREIGN KEY ("participant_id") REFERENCES "room_participants"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_answers_question_id_fkey') THEN
    ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_fkey"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_answers_room_id_fkey') THEN
    ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_room_id_fkey"
      FOREIGN KEY ("room_id") REFERENCES "quiz_rooms"("id") ON DELETE CASCADE;
  END IF;
END $$;
