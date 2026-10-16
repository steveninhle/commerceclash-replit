-- AlterTable
ALTER TABLE "class" ADD COLUMN "cohort_id" UUID;

-- AddForeignKey
ALTER TABLE "class" ADD CONSTRAINT "class_cohort_id_fkey"
    FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE SET NULL;

-- CreateIndex
CREATE INDEX "idx_class_cohort" ON "class"("cohort_id");
