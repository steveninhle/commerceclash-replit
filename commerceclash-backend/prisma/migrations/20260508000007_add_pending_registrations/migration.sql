CREATE TABLE "pending_registrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "session_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "encrypted_password" TEXT NOT NULL,
  "cohort_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pending_registrations_session_id_key" ON "pending_registrations"("session_id");
