export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatShortDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Matches cohort_schedules.day_of_week's convention: 0=Sun, 1=Mon, ..., 6=Sat.
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const formatDayOfWeek = (dayOfWeek: number): string =>
  WEEKDAY_NAMES[dayOfWeek] ?? "—";

// "18:05" -> "6:05 pm". Schedule times are stored as plain "HH:MM" wall-clock
// strings (see cohort_schedules), not Date objects, so this parses the
// string directly instead of round-tripping through Date.
export const formatTime12h = (timeStr: string): string => {
  const [hour, minute] = timeStr.split(":").map(Number);
  const period = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Minutes between two "HH:MM" wall-clock times, e.g. ("09:00", "10:15") -> 75.
export const getMinutesBetween = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
};

// IANA zone (e.g. "Asia/Ho_Chi_Minh") -> a short UTC-offset label (e.g.
// "GMT+7"), for display next to a schedule time. Returns null when the zone
// is missing or the runtime can't resolve it, rather than guessing.
export const formatTimezoneOffset = (timezone: string | null): string | null => {
  if (!timezone) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value ?? null;
  } catch {
    return null;
  }
};
