export type Rival = {
  is_cancelled: boolean | null;
  skill_unlocked?: boolean | null;
  users: {
    id: string;
    name: string | null;
  };
  archtypes?: {
    title: string;
    sub_title: string | null;
  } | null;
  student_attributes: {
    value: number;
    attributes: { name: string };
  }[];
};

export type SabotageRival = {
  student_id: string;
  is_cancelled: boolean | null;
  student_attributes: {
    id: string;
    value: number;
  }[];
};

export type ScenarioType = 'market' | 'crisis' | 'opportunity' | 'challenge';

/**
 * Placeholder for the "actual" upcoming scenario type until the real
 * scenario-drawing system exists to supply it. Shared by every perk that
 * reasons about the upcoming scenario (Prophecy, Crystal Ball, ...) so they
 * always agree on what "upcoming"/"correct" means.
 */
export const UPCOMING_SCENARIO_TYPE: ScenarioType = 'market';
