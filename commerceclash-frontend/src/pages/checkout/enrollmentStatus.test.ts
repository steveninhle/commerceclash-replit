import assert from "node:assert/strict";
import { test } from "node:test";
import { waitForEnrollment } from "./enrollmentStatus.ts";

test("waits through pending status before accepting backend completion", async () => {
  let requests = 0;
  const result = await waitForEnrollment(
    async () => ({ status: ++requests === 3 ? "completed" : "pending" }),
    { signal: new AbortController().signal, intervalMs: 1, timeoutMs: 1000 },
  );
  assert.equal(result, "completed");
  assert.equal(requests, 3);
});

test("accepts enrollment already completed before the first poll", async () => {
  const result = await waitForEnrollment(async () => ({ status: "completed" }), {
    signal: new AbortController().signal,
  });
  assert.equal(result, "completed");
});

test("retries transient errors without treating them as success", async () => {
  let requests = 0;
  const result = await waitForEnrollment(
    async () => {
      if (++requests === 1) throw new Error("Network unavailable");
      return { status: "completed" };
    },
    { signal: new AbortController().signal, intervalMs: 1, timeoutMs: 1000 },
  );
  assert.equal(result, "completed");
  assert.equal(requests, 2);
});

test("returns timeout when enrollment remains pending", async () => {
  const result = await waitForEnrollment(async () => ({ status: "pending" }), {
    signal: new AbortController().signal,
    intervalMs: 1,
    timeoutMs: 20,
  });
  assert.equal(result, "timeout");
});

test("times out and aborts a stalled status request", async () => {
  let requestSignal: AbortSignal | undefined;
  const result = await waitForEnrollment(
    (signal) => {
      requestSignal = signal;
      return new Promise(() => {});
    },
    { signal: new AbortController().signal, timeoutMs: 20 },
  );
  assert.equal(result, "timeout");
  assert.equal(requestSignal?.aborted, true);
});

test("cancels polling and ignores a late successful response after unmount", async () => {
  const controller = new AbortController();
  let finishRequest: ((value: { status: "completed" }) => void) | undefined;
  let requestSignal: AbortSignal | undefined;
  const completion = waitForEnrollment(
    (signal) => {
      requestSignal = signal;
      return new Promise((resolve) => {
        finishRequest = resolve;
      });
    },
    { signal: controller.signal },
  );
  controller.abort();
  finishRequest?.({ status: "completed" });
  assert.equal(await completion, "cancelled");
  assert.equal(requestSignal?.aborted, true);
});

test("does not request status for an already cancelled checkout", async () => {
  const controller = new AbortController();
  controller.abort();
  let requests = 0;
  const result = await waitForEnrollment(
    async () => {
      requests++;
      return { status: "completed" };
    },
    { signal: controller.signal },
  );
  assert.equal(result, "cancelled");
  assert.equal(requests, 0);
});
