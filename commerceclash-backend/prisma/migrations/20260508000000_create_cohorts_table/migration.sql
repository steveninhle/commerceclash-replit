-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),

    -- basic info
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,

    -- ownership
    "teacher_id" UUID,

    -- lifecycle
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',

    -- scheduling
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "timezone" VARCHAR(100),

    -- settings
    "max_students" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,

    -- analytics (denormalized counts)
    "total_classes" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,

    -- timestamps
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "archived_at" TIMESTAMPTZ,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "cohorts_teacher_id_fkey"
        FOREIGN KEY ("teacher_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_slug_key"
ON "cohorts"("slug");

CREATE INDEX "idx_cohorts_status"
ON "cohorts"("status");

CREATE INDEX "idx_cohorts_start_date"
ON "cohorts"("start_date");

CREATE INDEX "idx_cohorts_teacher_id"
ON "cohorts"("teacher_id");