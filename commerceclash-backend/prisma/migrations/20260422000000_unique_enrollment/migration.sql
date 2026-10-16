-- Remove duplicate enrollments, keeping the earliest one per (student_id, class_id)
DELETE FROM enrolled_students
WHERE id NOT IN (
  SELECT DISTINCT ON (student_id, class_id) id
  FROM enrolled_students
  ORDER BY student_id, class_id, created_at ASC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE "enrolled_students" ADD CONSTRAINT "enrolled_students_student_id_class_id_key" UNIQUE ("student_id", "class_id");
