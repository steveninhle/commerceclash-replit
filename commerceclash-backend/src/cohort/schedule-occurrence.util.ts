import { DateTime } from 'luxon';

/**
 * Fallback zone used only when a cohort has no saved `timezone` (e.g. cohorts
 * created before timezone capture was added to cohort creation). Configurable
 * via env so no timezone assumption is baked into the code — set
 * DEFAULT_COHORT_TIMEZONE in the deployment environment to the zone that
 * matches your primary user base. Falls back to 'UTC' only if unset, and the
 * caller is expected to surface `usedFallback` so the gap stays visible
 * instead of silently producing shifted class times.
 */
export const DEFAULT_COHORT_TIMEZONE = process.env.DEFAULT_COHORT_TIMEZONE || 'UTC';

export interface ResolvedTimezone {
  zone: string;
  usedFallback: boolean;
}

/** Validates a cohort's saved timezone, falling back to DEFAULT_COHORT_TIMEZONE when missing or invalid. */
export function resolveCohortTimezone(
  timezone: string | null | undefined,
  fallback: string = DEFAULT_COHORT_TIMEZONE,
): ResolvedTimezone {
  if (timezone && DateTime.local().setZone(timezone).isValid) {
    return { zone: timezone, usedFallback: false };
  }
  return { zone: fallback, usedFallback: true };
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Converts a wall-clock "HH:MM" on a given calendar date, interpreted in
 * `zone`, into the equivalent absolute UTC instant. This conversion is
 * independent of the host process's own local timezone — the same inputs
 * always produce the same UTC instant regardless of the server's `TZ`.
 */
export function toUtcInstant(calendarDate: CalendarDate, timeString: string, zone: string): Date {
  const [hour, minute] = timeString.split(':').map(Number);
  return DateTime.fromObject(
    {
      year: calendarDate.year,
      month: calendarDate.month,
      day: calendarDate.day,
      hour,
      minute,
    },
    { zone },
  )
    .toUTC()
    .toJSDate();
}
