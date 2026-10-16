-- CreateTable
CREATE TABLE "cohort_schedules" (
    "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
    "cohort_id"    UUID        NOT NULL,
    "day_of_week"  SMALLINT    NOT NULL,
    "start_time"   VARCHAR(10) NOT NULL,
    "end_time"     VARCHAR(10) NOT NULL,
    "meeting_link" TEXT,
    "passcode"     TEXT,
    "is_active"    BOOLEAN     NOT NULL DEFAULT true,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_cohort_schedules_cohort" ON "cohort_schedules"("cohort_id");

-- AddForeignKey
ALTER TABLE "cohort_schedules" ADD CONSTRAINT "cohort_schedules_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
