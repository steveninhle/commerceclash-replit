-- CreateTable
CREATE TABLE "cohort_students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohort_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "cohort_students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cohort_students_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE,
    CONSTRAINT "cohort_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cohort_students_cohort_id_student_id_key" ON "cohort_students"("cohort_id", "student_id");

CREATE INDEX "idx_cohort_students_cohort" ON "cohort_students"("cohort_id");

CREATE INDEX "idx_cohort_students_student" ON "cohort_students"("student_id");
