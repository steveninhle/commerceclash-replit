-- Remove the task-evaluation and live-quiz feature: it was never wired up
-- to any application code (no controllers/services reference these tables).
-- Drop child tables before their parents to satisfy foreign key constraints.

DROP TABLE IF EXISTS "student_answers";
DROP TABLE IF EXISTS "task_evaluations";
DROP TABLE IF EXISTS "room_participants";
DROP TABLE IF EXISTS "options";
DROP TABLE IF EXISTS "questions";
DROP TABLE IF EXISTS "quiz_rooms";
DROP TABLE IF EXISTS "class_tasks";
DROP TABLE IF EXISTS "quizzes";

DROP TYPE IF EXISTS "quiz_room_status";
DROP TYPE IF EXISTS "task_score_level";
