-- Adds per-cohort Zoom meeting ownership + idempotency key.
-- Additive only (all nullable) — safe to run against production without downtime.
-- Matches prisma/schema.prisma `cohorts` model; run this, then:
--   npx prisma migrate resolve --applied <migration_name>
-- if/when you reconcile the shadow-DB drift and want `prisma migrate dev` usable again.

ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS zoom_meeting_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS zoom_uuid VARCHAR(100),
  ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
  ADD COLUMN IF NOT EXISTS zoom_start_url TEXT,
  ADD COLUMN IF NOT EXISTS zoom_passcode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS zoom_host_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS cohorts_zoom_meeting_id_key ON cohorts (zoom_meeting_id);
CREATE UNIQUE INDEX IF NOT EXISTS cohorts_idempotency_key_key ON cohorts (idempotency_key);
