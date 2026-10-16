ALTER TABLE "checkout_orders"
  ADD COLUMN "seat_reserved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reservation_expires_at" TIMESTAMPTZ(6),
  ADD COLUMN "fulfilled_at" TIMESTAMPTZ(6);
CREATE INDEX "checkout_orders_cohort_id_seat_reserved_idx" ON "checkout_orders"("cohort_id", "seat_reserved");
CREATE INDEX "checkout_orders_reservation_expires_at_idx" ON "checkout_orders"("reservation_expires_at");
ALTER TABLE "stripe_events" ADD COLUMN "outcome" TEXT NOT NULL DEFAULT 'completed';
