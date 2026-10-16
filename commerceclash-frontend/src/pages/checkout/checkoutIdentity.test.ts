import assert from "node:assert/strict";
import { test } from "node:test";
import { getCheckoutId, isPaymentSubmitted } from "./checkoutIdentity.ts";

const id = "ce16646d-2e99-49ef-ab42-968f89d28821";
const otherId = "c81c0a02-8cdf-4f52-92be-a62c70cbcf8d";
const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};

test("retains checkout identity across refreshes and email capitalization changes", async () => {
  const storage = makeStorage();
  const first = await getCheckoutId(
    storage,
    "class",
    "student@example.test",
    undefined,
    () => id,
  );
  const refreshed = await getCheckoutId(
    storage,
    "class",
    " STUDENT@example.test ",
    undefined,
    () => otherId,
  );
  assert.equal(first, refreshed);
});

test("uses a different identity for a different email or class", async () => {
  const storage = makeStorage();
  await getCheckoutId(
    storage,
    "class",
    "student@example.test",
    undefined,
    () => id,
  );
  assert.equal(
    await getCheckoutId(
      storage,
      "other-class",
      "student@example.test",
      undefined,
      () => otherId,
    ),
    otherId,
  );
  assert.equal(
    await getCheckoutId(
      storage,
      "class",
      "other@example.test",
      undefined,
      () => otherId,
    ),
    otherId,
  );
});

test("serializes simultaneous tabs when a browser lock is available", async () => {
  const storage = makeStorage();
  let queue = Promise.resolve();
  let generations = 0;
  const lock = (_key: string, work: () => string): Promise<string> => {
    const result = queue.then(work);
    queue = result.then(() => {});
    return result;
  };
  const generate = () => {
    generations++;
    return id;
  };
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      getCheckoutId(storage, "class", "student@example.test", lock, generate),
    ),
  );
  assert.equal(new Set(results).size, 1);
  assert.equal(generations, 1);
});

test("fails before payment creation if the checkout key cannot be saved", async () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage unavailable");
    },
  };
  await assert.rejects(
    getCheckoutId(
      storage,
      "class",
      "student@example.test",
      undefined,
      () => id,
    ),
    /Storage unavailable/,
  );
});

test("replaces malformed stored keys instead of sending invalid API requests", async () => {
  const storage = {
    getItem: () => "invalid",
    setItem: (_key: string, value: string) => {
      assert.equal(value, id);
    },
  };
  assert.equal(
    await getCheckoutId(
      storage,
      "class",
      "student@example.test",
      undefined,
      () => id,
    ),
    id,
  );
});

test("accepted payments resume confirmation while unaccepted payments remain payable", () => {
  for (const status of ["processing", "succeeded", "requires_capture"])
    assert.equal(isPaymentSubmitted(status), true);
  for (const status of [
    "requires_payment_method",
    "requires_action",
    "requires_confirmation",
    "canceled",
  ])
    assert.equal(isPaymentSubmitted(status), false);
});
