-- Add composite index on enrolled_students(student_id, class_id)
-- This speeds up all enrollment lookups by student+class (unlock, reset, approve, deny, assignCeo)
CREATE INDEX IF NOT EXISTS "enrolled_students_student_id_class_id_idx" ON "enrolled_students"("student_id", "class_id");

-- Add index on student_perks(enrollment_id)
-- This speeds up all perk lookups by enrollment
CREATE INDEX IF NOT EXISTS "student_perks_enrollment_id_idx" ON "student_perks"("enrollment_id");
