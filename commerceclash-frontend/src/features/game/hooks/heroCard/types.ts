export interface Character {
  id: string;
  title: string;
  subtitle: string;
  perks: {
    id: string;
    title: string;
    description: string;
    is_unlocked: boolean;
    used: boolean;
    status: string | null;
    approved: boolean;
    key?: string;
    perk_type?: string;
    is_repeatable?: boolean;
    next_available_at?: string | null;
    last_used_at?: string | null;
    required_level?: number;
  }[];
}

export type Perk = Character["perks"][number];

export const REACTIVE_ONLY_PERK_KEYS = [
  "spotlight",
  "star_power",
  "prophecy",
  "extortion",
  "crystal_ball",
  "masterpiece",
  "rebirth",
  "insider_trading",
] as const;

export type ReactiveOnlyPerkKey = (typeof REACTIVE_ONLY_PERK_KEYS)[number];

export function isReactiveOnlyPerkKey(key?: string | null): boolean {
  if (!key) return false;
  return (REACTIVE_ONLY_PERK_KEYS as readonly string[]).includes(
    key.toLowerCase().replace(/[\s-]/g, "_")
  );
}

export interface SabotageRival {
  id: string;
  name: string;
  marketShare?: number;
  ceo?: { title: string };
}

export interface TrendsetterRival {
  id: string;
  name: string;
  marketShare: number;
  ceo?: { title: string };
}

export interface ReveredIconPendingPerk {
  pendingKey: string;
  rival: { id: string; name: string };
  perk: { id: string; title: string };
  cancelWindowMs: number;
  expiresAt: number;
}

// RivalSkill for Corporate Espionage (view only)
export interface RivalSkill {
  attributeName: string;
  value: number;
  temporaryValue?: number;
  effectiveValue?: number;
}

export interface RivalSkillTree {
  studentId: string;
  name: string;
  skills: RivalSkill[];
}

// Fan the Flames types
export interface FanTheFlamesRival {
  id: string;
  name: string;
  marketShare: number;
}

export interface FanTheFlamesOffer {
  pendingKey: string;
  amount: number;
  sourcePerkTitle: string;
  attackerName: string;
  rivals: FanTheFlamesRival[];
  decisionWindowMs: number;
  expiresAt: number;
}

// Danger Zone types
export interface SkillDeduction {
  skillId: string;
  amount: number;
}

export interface DangerZoneOwnSkill {
  skillId: string;
  skillName: string;
  currentValue: number;
}

export interface DangerZoneRival {
  id: string;
  name: string;
  marketShare: number;
  ceo?: { title: string };
}

export interface DangerZonePhaseData {
  phase?: number;
  requiresSelection?: boolean;
  pendingCompletion?: boolean;
  skillTree: DangerZoneOwnSkill[];
  pointsToRemove: number;
  msToSteal: number;
  rivals: DangerZoneRival[];
  missingConditions?: {
    needsSkillSelection: boolean;
    needsTargetSelection: boolean;
  };
}

// Scenario types (Prophecy, Crystal Ball, Insider Trading)
export type ScenarioType = "market" | "crisis" | "opportunity" | "challenge";

export const SCENARIO_TYPES: readonly ScenarioType[] = [
  "market",
  "crisis",
  "opportunity",
  "challenge",
] as const;

export interface ScenarioPredictionData {
  classId: string;
  studentId: string;
  predictedType: ScenarioType;
}

export interface PerkCompleteWithTargetPayload {
  classId: string;
  studentId: string;
  perkId: string;
  targetStudentId: string;
  skillDeductions?: SkillDeduction[];
}

export interface PerkCancelPayload {
  classId: string;
  studentId: string;
  perkId: string;
  perkKey?: string;
}

export interface ScenarioChosenPayload {
  classId: string;
  studentId: string;
  perkId: string;
  scenario: {
    id: string;
    title: string;
    description: string;
    category: ScenarioType;
  };
}

export interface TrendsetterTargetPayload {
  classId: string;
  studentId: string;
  perkId: string;
  targetStudentId: string;
}


