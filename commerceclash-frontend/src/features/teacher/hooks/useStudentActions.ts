import { useCallback } from "react";
import { toast } from "sonner";
import { post, patch, END_POINTS } from "@/api";
import type { StudentPerk } from "../pages/manageClass";
import type { ClassAction, ClassState } from "./classReducer";

type Dispatch = React.Dispatch<ClassAction>;

interface UseStudentActionsOptions {
  classId: string;
  state: ClassState;
  dispatch: Dispatch;
  socket: any;
  pendingPerkActionsRef: React.MutableRefObject<
    Map<string, { studentId: string; previousStatus: string | null }>
  >;
}

export function useStudentActions({
  classId,
  state,
  dispatch,
  socket,
  pendingPerkActionsRef,
}: UseStudentActionsOptions) {
  const handleXpIncrease = useCallback(
    (studentId: string) => dispatch({ type: "XP_INCREASE", studentId }),
    [dispatch],
  );

  const handleXpChange = useCallback(
    (studentId: string, xp: number) => {
      dispatch({ type: "XP_CHANGE", studentId, xp });
    },
    [dispatch],
  );

  const handleMsChange = useCallback(
    (studentId: string, ms: number) => {
      dispatch({ type: "MS_CHANGE", studentId, ms });
    },
    [dispatch],
  );

  const handleSkillChange = useCallback(
    (studentId: string, skillId: string, value: number) =>
      dispatch({ type: "SKILL_CHANGE", studentId, skillId, value }),
    [dispatch],
  );

  const handleToggleSkillLock = useCallback(
    (studentId: string) => dispatch({ type: "TOGGLE_SKILL_LOCK", studentId }),
    [dispatch],
  );

  const handleToggleAllSkillLock = useCallback(
    (unlock: boolean) => dispatch({ type: "TOGGLE_ALL_SKILL_LOCK", unlock }),
    [dispatch],
  );

  const handleCeoChange = useCallback(
    async (studentId: string, ceoId: string) => {
      const role = state.roles.find((r) => r.id === ceoId);
      const newCeo = role ? { id: ceoId, name: role.label } : undefined;

      dispatch({ type: "CEO_OPTIMISTIC", studentId, ceo: newCeo });
      dispatch({ type: "PERK_LOADING_ADD", studentId });

      try {
        const res = await post(
          END_POINTS.ASSIGN_STUDENT_CEO.replace("{cid}", classId).replace(
            "{sid}",
            studentId,
          ),
          { ceoId },
        );
        const newPerks: StudentPerk[] = (res.data?.perks ?? []).map(
          (p: any) => ({
            id: p.id,
            key: p.key,
            title: p.title,
            description: null,
            is_coded: false,
            is_repeatable: false,
            auto_approve: false,
            perk_status: null,
            is_unlocked: p.is_unlocked,
            is_used: p.is_used,
            is_approved: null,
            last_used_at: null,
            next_available_at: null,
          }),
        );
        dispatch({
          type: "CEO_CONFIRM",
          studentId,
          ceo: newCeo,
          perks: newPerks,
        });
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to assign CEO. Please try again.");
        dispatch({ type: "CEO_REVERT", studentId });
      } finally {
        dispatch({ type: "PERK_LOADING_REMOVE", studentId });
      }
    },
    [classId, state.roles, dispatch],
  );

  const handlePerkAction = useCallback(
    async (
      studentId: string,
      perk: StudentPerk,
      action: "unlock" | "approved" | "denied" | "reset",
    ) => {
      try {
        const base = END_POINTS.USE_PERK.replace("{cid}", classId)
          .replace("{sid}", studentId)
          .replace("{pid}", perk.id);

        if (action === "unlock") {
          await patch(`${base}/unlock`, {});
          dispatch({
            type: "PERK_UPDATE_STUDENT",
            studentId,
            perkId: perk.id,
            changes: { is_unlocked: true },
          });
        } else if (action === "reset") {
          await patch(`${base}/reset`, {});
          dispatch({
            type: "PERK_UPDATE_STUDENT",
            studentId,
            perkId: perk.id,
            changes: { is_used: false, is_approved: false, perk_status: null },
          });
        } else {
          pendingPerkActionsRef.current.set(perk.id, {
            studentId,
            previousStatus: perk.perk_status,
          });
          socket.emit("perk-approve-response", {
            classId,
            studentId,
            perkId: perk.id,
            isApproved: action === "approved",
          });
          dispatch({
            type: "PERK_UPDATE_STUDENT",
            studentId,
            perkId: perk.id,
            changes: { perk_status: action },
          });
        }
      } catch (err: any) {
        toast.error(err?.message ?? "Something went wrong updating this perk. Please try again.");
      }
    },
    [classId, dispatch, socket, pendingPerkActionsRef],
  );

  return {
    handleXpIncrease,
    handleXpChange,
    handleMsChange,
    handleSkillChange,
    handleToggleSkillLock,
    handleToggleAllSkillLock,
    handleCeoChange,
    handlePerkAction,
  };
}
