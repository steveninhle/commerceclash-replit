import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import { post, patch, END_POINTS } from "@/api";
import type { ClassState, ClassAction } from "./classReducer";
type Dispatch = React.Dispatch<ClassAction>;

export function usePendingChanges(
  classId: string,
  state: ClassState,
  dispatch: Dispatch,
  socket: any,
) {
  const hasPendingChanges = useMemo(() => {
    return state.students.some((s) => {
      const orig = state.originalStudents.find((o) => o.id === s.id);
      if (!orig) return false;
      if ((s.xp ?? 0) !== (orig.xp ?? 0)) return true;
      if ((s.ms ?? 0) !== (orig.ms ?? 0)) return true;
      if ((s.skill_unlocked ?? false) !== (orig.skill_unlocked ?? false)) return true;
      return (s.skillEntries ?? []).some((sk) => {
        const origSk = orig.skillEntries?.find((o) => o.id === sk.id);
        return origSk !== undefined && sk.value !== origSk.value;
      });
    });
  }, [state.students, state.originalStudents]);

  const handleSaveAll = useCallback(async () => {
    dispatch({ type: "SAVE_START" });

    // Each task is tagged with studentId + which field it covers,
    // so we can advance only the fields that actually succeeded.
    type FieldType = "xp" | "ms" | "skill" | "lock";
    type TaggedTask = { studentId: string; field: FieldType; skillId?: string; promise: Promise<unknown> };
    const taggedTasks: TaggedTask[] = [];
    const lockChangedIds: string[] = [];

    const xpBatch: Record<string, number>[] = [];
    const msBatch: Record<string, number>[] = [];
    const xpStudentIds: string[] = [];
    const msStudentIds: string[] = [];

    for (const s of state.students) {
      const orig = state.originalStudents.find((o) => o.id === s.id);
      if (!orig) continue;

      const xpDelta = (s.xp ?? 0) - (orig.xp ?? 0);
      if (xpDelta > 0) {
        xpBatch.push({ [s.id]: xpDelta });
        xpStudentIds.push(s.id);
      }

      if ((s.ms ?? 0) !== (orig.ms ?? 0)) {
        msBatch.push({ [s.id]: s.ms ?? 0 });
        msStudentIds.push(s.id);
      }

      if ((s.skill_unlocked ?? false) !== (orig.skill_unlocked ?? false)) {
        lockChangedIds.push(s.id);
      }

      for (const sk of s.skillEntries ?? []) {
        const origSk = orig.skillEntries?.find((o) => o.id === sk.id);
        if (origSk !== undefined && sk.value !== origSk.value) {
          taggedTasks.push({
            studentId: s.id,
            field: "skill",
            skillId: sk.id,
            promise: patch(
              END_POINTS.UPDATE_SKILL.replace("{sid}", s.id)
                .replace("{cid}", classId)
                .replace("{skillId}", sk.id),
              { value: sk.value },
            ),
          });
        }
      }
    }

    // XP and MS are batch calls — all students in the batch share the same promise
    if (xpBatch.length > 0) {
      const xpPromise = post(END_POINTS.CLASS_STUDENT_XP.replace("{cid}", classId), xpBatch);
      for (const sid of xpStudentIds) {
        taggedTasks.push({ studentId: sid, field: "xp", promise: xpPromise });
      }
    }
    if (msBatch.length > 0) {
      const msPromise = post(END_POINTS.MARKET_SHARE.replace("{cid}", classId), msBatch);
      for (const sid of msStudentIds) {
        taggedTasks.push({ studentId: sid, field: "ms", promise: msPromise });
      }
    }

    // Skill lock via socket — fire-and-forget, always treated as succeeded
    for (const sid of lockChangedIds) {
      socket.emit("update-skills-status", { classId, studentId: sid });
    }

    const settled = await Promise.allSettled(taggedTasks.map((t) => t.promise));

    type FieldSuccessMap = Map<string, Set<FieldType>>;
    // { studentId -> { field -> errorMessage } }
    type FieldErrorMap = Map<string, Map<FieldType, string>>;

    const succeededFields: FieldSuccessMap = new Map();
    const failedFields: FieldErrorMap = new Map();

    const fieldLabel: Record<FieldType, string> = {
      xp: "XP",
      ms: "Market Share",
      skill: "Skills",
      lock: "Skill Lock",
    };

    settled.forEach((result, i) => {
      const { studentId, field } = taggedTasks[i];
      if (result.status === "fulfilled") {
        if (!succeededFields.has(studentId)) succeededFields.set(studentId, new Set());
        succeededFields.get(studentId)!.add(field);
      } else {
        if (!failedFields.has(studentId)) failedFields.set(studentId, new Map());
        // Only store the first error per field (batch calls share a promise so same error)
        if (!failedFields.get(studentId)!.has(field)) {
          const reason = result.reason;
          const msg: string =
            reason?.response?.data?.message ??
            reason?.message ??
            "Unknown error";
          failedFields.get(studentId)!.set(field, msg);
        }
      }
    });

    // Lock-only changes count as succeeded
    for (const sid of lockChangedIds) {
      if (!succeededFields.has(sid)) succeededFields.set(sid, new Set());
      succeededFields.get(sid)!.add("lock");
    }

    const allChangedIds = new Set([
      ...succeededFields.keys(),
      ...failedFields.keys(),
    ]);

    const fullySucceededIds = [...allChangedIds].filter((id) => !failedFields.has(id));
    const succeededFieldsPerStudent = succeededFields;

    if (failedFields.size === 0) {
      toast.success("All changes saved successfully");
      dispatch({ type: "SAVE_SUCCESS" });
    } else {
      // Fire one toast per student that had failures, listing each failed field + reason
      for (const [studentId, fieldErrors] of failedFields) {
        const studentName = state.students.find((s) => s.id === studentId)?.name ?? studentId;
        const lines = [...fieldErrors.entries()]
          .map(([field, msg]) => `• ${fieldLabel[field]}: ${msg}`)
          .join("\n");
        toast.error(`${studentName}\n${lines}`, { duration: 6000 });
      }

      if (fullySucceededIds.length > 0 || succeededFields.size > 0) {
        dispatch({ type: "SAVE_PARTIAL", succeededStudentIds: fullySucceededIds, succeededFieldsPerStudent });
      } else {
        dispatch({ type: "SAVE_ERROR" });
      }
    }
  }, [classId, state.students, state.originalStudents, dispatch, socket]);

  return { hasPendingChanges, handleSaveAll };
}
