CREATE TABLE "stripe_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stripe_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "payload" JSONB,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stripe_events_stripe_event_id_key" UNIQUE ("stripe_event_id")
);

CREATE INDEX "idx_stripe_events_event_id" ON "stripe_events"("stripe_event_id");
