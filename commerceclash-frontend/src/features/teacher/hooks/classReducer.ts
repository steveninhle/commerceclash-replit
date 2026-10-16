import type { ClassStudent, StudentPerk } from "../pages/manageClass";

// ── State ────────────────────────────────────────────────────────────────────

export interface ClassState {
  /** Server snapshot — used for diff on Save All */
  originalStudents: ClassStudent[];
  /** Local editable state */
  students: ClassStudent[];
  roles: { id: string; label: string }[];
  loading: boolean;
  isSaving: boolean;
  perkLoadingIds: Set<string>;
}

export const initialClassState: ClassState = {
  originalStudents: [],
  students: [],
  roles: [],
  loading: false,
  isSaving: false,
  perkLoadingIds: new Set(),
};

// ── Actions ──────────────────────────────────────────────────────────────────

export type ClassAction =
  // fetch lifecycle
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; students: ClassStudent[] }
  | { type: "SET_ROLES"; roles: { id: string; label: string }[] }
  // local mutations (no API yet)
  | { type: "XP_INCREASE"; studentId: string }
  | { type: "XP_CHANGE"; studentId: string; xp: number }
  | { type: "MS_CHANGE"; studentId: string; ms: number }
  | { type: "SKILL_CHANGE"; studentId: string; skillId: string; value: number }
  | { type: "TOGGLE_SKILL_LOCK"; studentId: string }
  | { type: "TOGGLE_ALL_SKILL_LOCK"; unlock: boolean }
  // CEO (optimistic + confirm/revert)
  | { type: "CEO_OPTIMISTIC"; studentId: string; ceo: ClassStudent["ceo"] }
  | {
      type: "CEO_CONFIRM";
      studentId: string;
      ceo: ClassStudent["ceo"];
      perks: StudentPerk[];
    }
  | { type: "CEO_REVERT"; studentId: string }
  | { type: "PERK_LOADING_ADD"; studentId: string }
  | { type: "PERK_LOADING_REMOVE"; studentId: string }
  // save lifecycle
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS" }
  | { type: "SAVE_ERROR" }
  | { type: "SAVE_PARTIAL"; succeededStudentIds: string[]; succeededFieldsPerStudent: Map<string, Set<"xp" | "ms" | "skill" | "lock">> }
  // perk mutations
  | {
      type: "PERK_UPDATE_GLOBAL";
      perkId: string;
      changes: Partial<StudentPerk>;
    }
  | {
      type: "PERK_UPDATE_STUDENT";
      studentId: string;
      perkId: string;
      changes: Partial<StudentPerk>;
    }
  | { type: "PERKS_AUTO_UNLOCKED"; studentId: string; perkIds: string[] }
  // socket-driven student mutations (also advance originalStudents)
  | { type: "SYNC_STUDENTS"; updater: (prev: ClassStudent[]) => ClassStudent[] }
  // skill entries
  | {
      type: "SKILL_ENTRIES_UPDATE";
      studentId: string;
      updates: { skillId: string; value: number }[];
      skillUnlocked?: boolean;
    }
  // MS side-effects from socket
  | { type: "MS_ADJUST"; adjustments: { studentId: string; delta: number }[] }
  // available_points side-effect
  | {
      type: "AVAILABLE_POINTS_SYNC";
      studentId: string;
      available_points: number;
    }
  // skill_unlocked side-effect
  | { type: "SKILL_UNLOCKED_SET"; studentId: string; value: boolean };

// ── Helpers ──────────────────────────────────────────────────────────────────

const levelFromXp = (xp: number): number => {
  if (xp <= 9) return 1;
  if (xp <= 19) return 2;
  if (xp <= 29) return 3;
  if (xp <= 39) return 4;
  return 5;
};

function mapStudents(
  students: ClassStudent[],
  fn: (s: ClassStudent) => ClassStudent,
): ClassStudent[] {
  return students.map(fn);
}

function mapStudent(
  students: ClassStudent[],
  id: string,
  fn: (s: ClassStudent) => ClassStudent,
): ClassStudent[] {
  return students.map((s) => (s.id === id ? fn(s) : s));
}

function mapPerk(
  students: ClassStudent[],
  perkId: string,
  changes: Partial<StudentPerk>,
): ClassStudent[] {
  return students.map((s) => ({
    ...s,
    perks: s.perks?.map((p) => (p.id === perkId ? { ...p, ...changes } : p)),
  }));
}

function mapStudentPerk(
  students: ClassStudent[],
  studentId: string,
  perkId: string,
  changes: Partial<StudentPerk>,
): ClassStudent[] {
  return mapStudent(students, studentId, (s) => ({
    ...s,
    perks: s.perks?.map((p) => (p.id === perkId ? { ...p, ...changes } : p)),
  }));
}

// ── Reducer ──────────────────────────────────────────────────────────────────

export function classReducer(
  state: ClassState,
  action: ClassAction,
): ClassState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        students: action.students,
        originalStudents: action.students,
      };

    case "SET_ROLES":
      return { ...state, roles: action.roles };

    case "XP_INCREASE":
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => {
          const xp = s.xp ?? 0;
          if (xp >= 40) return s;
          const newXp = xp + 1;
          return { ...s, xp: newXp, level: levelFromXp(newXp) };
        }),
      };

    case "XP_CHANGE":
      if (action.xp < 0 || action.xp > 40) return state;
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => {
          // Find original XP to allow decrement only to that value
          const originalStudent = state.originalStudents.find((orig) => orig.id === action.studentId);
          const originalXp = originalStudent?.xp ?? 0;
          
          // Allow change if new value is >= originalXp
          if (action.xp < originalXp) return s;
          
          return { ...s, xp: action.xp, level: levelFromXp(action.xp) };
        }),
      };

    case "MS_CHANGE":
      if (action.ms < 0 || action.ms > 100) return state;
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          ms: action.ms,
        })),
      };

    case "SKILL_CHANGE":
      if (action.value < 0 || action.value > 8) return state;
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          skillEntries: s.skillEntries?.map((sk) =>
            sk.id === action.skillId ? { ...sk, value: action.value } : sk,
          ),
        })),
      };

    case "TOGGLE_SKILL_LOCK":
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          skill_unlocked: !(s.skill_unlocked ?? false),
        })),
      };

    case "TOGGLE_ALL_SKILL_LOCK":
      return {
        ...state,
        students: mapStudents(state.students, (s) => ({
          ...s,
          skill_unlocked: action.unlock,
        })),
      };

    case "CEO_OPTIMISTIC":
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          ceo: action.ceo,
        })),
      };

    case "CEO_CONFIRM": {
      const updatedStudents = mapStudent(state.students, action.studentId, (s) => ({
        ...s,
        ceo: action.ceo,
        perks: action.perks,
      }));
      // Only sync CEO/perks in originalStudents — preserve other pending changes
      // (XP, MS, skills) so hasPendingChanges stays true and Save All stays visible.
      const updatedOriginals = mapStudent(state.originalStudents, action.studentId, (s) => ({
        ...s,
        ceo: action.ceo,
        perks: action.perks,
      }));
      return { ...state, students: updatedStudents, originalStudents: updatedOriginals };
    }

    case "CEO_REVERT":
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          ceo: state.originalStudents.find((o) => o.id === action.studentId)
            ?.ceo,
        })),
      };

    case "PERK_LOADING_ADD":
      return {
        ...state,
        perkLoadingIds: new Set(state.perkLoadingIds).add(action.studentId),
      };

    case "PERK_LOADING_REMOVE": {
      const next = new Set(state.perkLoadingIds);
      next.delete(action.studentId);
      return { ...state, perkLoadingIds: next };
    }

    case "SAVE_START":
      return { ...state, isSaving: true };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        originalStudents: state.students.map((s) => ({
          ...s,
          skillEntries: s.skillEntries ? [...s.skillEntries] : [],
        })),
      };

    case "SAVE_ERROR":
      return { ...state, isSaving: false };

    case "SAVE_PARTIAL": {
      const succeeded = new Set(action.succeededStudentIds);
      const updatedOriginals = state.originalStudents.map((orig) => {
        const current = state.students.find((s) => s.id === orig.id);
        if (!current) return orig;

        // Fully succeeded student — advance entire snapshot
        if (succeeded.has(orig.id)) {
          return { ...current, skillEntries: current.skillEntries ? [...current.skillEntries] : [] };
        }

        // Partially succeeded — advance only the fields that saved
        const fields = action.succeededFieldsPerStudent.get(orig.id);
        if (!fields) return orig;

        return {
          ...orig,
          ...(fields.has("xp") ? { xp: current.xp, level: current.level } : {}),
          ...(fields.has("ms") ? { ms: current.ms } : {}),
          ...(fields.has("lock") ? { skill_unlocked: current.skill_unlocked } : {}),
          skillEntries: fields.has("skill")
            ? current.skillEntries
              ? [...current.skillEntries]
              : []
            : orig.skillEntries,
        };
      });
      return { ...state, isSaving: false, originalStudents: updatedOriginals };
    }

    case "PERK_UPDATE_GLOBAL":
      return {
        ...state,
        students: mapPerk(state.students, action.perkId, action.changes),
      };

    case "PERK_UPDATE_STUDENT":
      return {
        ...state,
        students: mapStudentPerk(
          state.students,
          action.studentId,
          action.perkId,
          action.changes,
        ),
      };

    case "PERKS_AUTO_UNLOCKED": {
      const perkIdSet = new Set<string>(action.perkIds);
      const next = mapStudent(state.students, action.studentId, (s) => ({
        ...s,
        perks: s.perks?.map((p) =>
          perkIdSet.has(p.id) ? { ...p, is_unlocked: true } : p,
        ),
      }));
      return { ...state, students: next, originalStudents: next };
    }

    case "SYNC_STUDENTS": {
      const next = action.updater(state.students);
      return { ...state, students: next, originalStudents: next };
    }

    case "SKILL_ENTRIES_UPDATE": {
      const next = mapStudent(state.students, action.studentId, (s) => ({
        ...s,
        skillEntries: s.skillEntries?.map((sk) => {
          const u = action.updates.find((u) => u.skillId === sk.id);
          return u ? { ...sk, value: u.value } : sk;
        }),
        skill_unlocked:
          action.skillUnlocked !== undefined
            ? action.skillUnlocked
            : s.skill_unlocked,
      }));
      return { ...state, students: next, originalStudents: next };
    }

    case "MS_ADJUST":
      return {
        ...state,
        students: state.students.map((s) => {
          const adj = action.adjustments.find((a) => a.studentId === s.id);
          if (!adj) return s;
          return { ...s, ms: Math.max(0, (s.ms ?? 0) + adj.delta) };
        }),
      };

    case "AVAILABLE_POINTS_SYNC": {
      const next = mapStudent(state.students, action.studentId, (s) => ({
        ...s,
        available_points: action.available_points,
      }));
      return { ...state, students: next, originalStudents: next };
    }

    case "SKILL_UNLOCKED_SET":
      return {
        ...state,
        students: mapStudent(state.students, action.studentId, (s) => ({
          ...s,
          skill_unlocked: action.value,
        })),
      };

    default:
      return state;
  }
}
