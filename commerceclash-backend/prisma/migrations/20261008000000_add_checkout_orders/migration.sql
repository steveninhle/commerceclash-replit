CREATE TABLE "checkout_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "checkout_key" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "customer_name" TEXT,
    "cohort_name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "payment_intent_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "checkout_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checkout_orders_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "checkout_orders_checkout_key_key" ON "checkout_orders"("checkout_key");
CREATE UNIQUE INDEX "checkout_orders_cohort_id_email_key" ON "checkout_orders"("cohort_id", "email");
CREATE UNIQUE INDEX "checkout_orders_payment_intent_id_key" ON "checkout_orders"("payment_intent_id");

-- Checkout keys and customer details are accessed only by the backend.
ALTER TABLE "checkout_orders" ENABLE ROW LEVEL SECURITY;
