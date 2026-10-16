import type { Leader, LeaderStatKey } from "./types";

/** Clamps a stat value into the 0-100 range used for progress bar widths. */
export const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value));

/** Fixed accent color per stat, matching the reference UI (stats are color-coded by kind, not by leader). */
export const STAT_COLORS: Record<LeaderStatKey, string> = {
  strategy: "#8B5CF6",
  control: "#3B82F6",
  vision: "#D946EF",
  influence: "#22C55E",
};

const STAT_SEGMENT_COUNT = 5;

/** How many of the 5 discrete meter blocks should render as "filled" for a given 0-100 value. */
export const getFilledSegments = (
  value: number,
  segments: number = STAT_SEGMENT_COUNT,
): number => Math.round((clampPercent(value) / 100) * segments);

/** "Amanda Brown" -> "AB", for seats with no avatar photo. */
export const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const LEADER_STAT_KEYS: LeaderStatKey[] = [
  "strategy",
  "control",
  "vision",
  "influence",
];

export const getLeaderStat = (leader: Leader, key: LeaderStatKey): number =>
  clampPercent(leader[key]);
