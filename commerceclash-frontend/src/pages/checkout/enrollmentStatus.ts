export type EnrollmentStatus = { status: "pending" | "completed" };
type PollResult = "completed" | "timeout" | "cancelled";

type PollOptions = {
  signal: AbortSignal;
  intervalMs?: number;
  timeoutMs?: number;
};

export const waitForEnrollment = (
  getStatus: (signal: AbortSignal) => Promise<EnrollmentStatus>,
  { signal, intervalMs = 2000, timeoutMs = 60000 }: PollOptions,
): Promise<PollResult> =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve("cancelled");
      return;
    }

    const requestController = new AbortController();
    let settled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: PollResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(pollTimer);
      clearTimeout(timeoutTimer);
      signal.removeEventListener("abort", cancel);
      requestController.abort();
      resolve(result);
    };

    const cancel = () => finish("cancelled");
    const timeoutTimer = setTimeout(() => finish("timeout"), timeoutMs);
    signal.addEventListener("abort", cancel, { once: true });

    const poll = async () => {
      try {
        const result = await getStatus(requestController.signal);
        if (settled) return;
        if (result.status === "completed") {
          finish("completed");
          return;
        }
      } catch {
        // A network error cannot establish completion. Retry until the deadline.
        if (settled) return;
      }
      pollTimer = setTimeout(poll, intervalMs);
    };

    void poll();
  });
