ALTER TABLE "stripe_events" ADD COLUMN IF NOT EXISTS "session_id" TEXT;
CREATE INDEX IF NOT EXISTS "stripe_events_session_id_idx" ON "stripe_events"("session_id");
