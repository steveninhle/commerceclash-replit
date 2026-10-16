/**
 * A class becomes eligible starting 11 minutes before its start_time and
 * STAYS eligible on every subsequent tick (since meeting_id === '' is the
 * gate, this is idempotent) until it's more than an hour past start.
 * A narrow slice tied 1:1 to the tick interval (e.g. exactly
 * [now+9min, now+11min]) is fragile: a single delayed tick or a write
 * landing at the wrong instant can let a class's start_time slide past
 * that slice between two ticks, permanently skipping it. Widening the
 * window makes this self-healing — a miss on one tick is caught by the
 * next.
 *
 * Pure function of `now` (an absolute instant) — independent of the host
 * process's local timezone, so it behaves identically in local dev and
 * production regardless of each environment's `TZ`.
 */
export interface MeetingEligibilityWindow {
  windowStart: Date;
  windowEnd: Date;
}

const LOOKBACK_MS = 60 * 60 * 1000; // 60 minutes
const LOOKAHEAD_MS = 11 * 60 * 1000; // 11 minutes

export function getMeetingEligibilityWindow(now: Date): MeetingEligibilityWindow {
  return {
    windowStart: new Date(now.getTime() - LOOKBACK_MS),
    windowEnd: new Date(now.getTime() + LOOKAHEAD_MS),
  };
}

/** Whether `startTime` falls within the eligibility window anchored at `now`. */
export function isWithinEligibilityWindow(startTime: Date, now: Date): boolean {
  const { windowStart, windowEnd } = getMeetingEligibilityWindow(now);
  return startTime.getTime() >= windowStart.getTime() && startTime.getTime() <= windowEnd.getTime();
}
