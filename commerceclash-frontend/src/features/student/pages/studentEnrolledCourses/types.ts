export interface ClassStatus {
  success: boolean;
  message: string;
  data: {
    class_id: string;
    name: string;
    status: boolean;
  };
}

export interface StudentOverviewData {
  id: string;
  name: string;
  level: number;
  xp: number;
  ms: number;
  skill_unlocked: boolean;
  skillEntries: { id: string; label: string; value: number }[];
  perks: { id: string; key: string; title: string; is_unlocked: boolean; is_used: boolean }[];
  ceo?: { id: string; name: string };
}
