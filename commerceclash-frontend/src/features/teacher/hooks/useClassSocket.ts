import { useEffect } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { ClassAction } from "./classReducer";

type Dispatch = React.Dispatch<ClassAction>;

interface UseClassSocketOptions {
  socket: Socket | null;
  classId: string;
  teacherId: string;
  dispatch: Dispatch;
  /** Ref that tracks perk actions for rollback on failure */
  pendingPerkActionsRef: React.MutableRefObject<
    Map<string, { studentId: string; previousStatus: string | null }>
  >;
  fetchStudents: () => Promise<void>;
}

export function useClassSocket({
  socket,
  classId,
  teacherId,
  dispatch,
  pendingPerkActionsRef,
  fetchStudents,
}: UseClassSocketOptions) {
  useEffect(() => {
    if (!socket) return;

    const cleanups: Array<() => void> = [];
    const listen = (event: string, handler: Parameters<Socket["on"]>[1]) => {
      socket.on(event, handler);
      cleanups.push(() => socket.off(event, handler));
    };

    const joinRoom = () => socket.emit("join-room", { classId: [classId], teacherId });
    joinRoom();
    listen("connect", joinRoom);

    listen("shift-skill", (response: any) => {
      const studentId: string | undefined = response?.data?.studentId;
      const updates: { skillId: string; value: number }[] = response?.data?.updates ?? [];
      const skillUnlocked: boolean | undefined = response?.data?.skill_unlocked;
      if (!studentId) return;
      toast.success(response?.message ?? "Skills shifted successfully");
      dispatch({
        type: "SKILL_ENTRIES_UPDATE",
        studentId,
        updates,
        skillUnlocked,
      });
    });

    listen("skills-status-updated", (response: any) => {
      if (response?.data?.studentId) {
        dispatch({
          type: "SYNC_STUDENTS",
          updater: (prev) =>
            prev.map((s) =>
              s.id === response.data.studentId
                ? { ...s, skill_unlocked: response.data.skill_unlocked }
                : s,
            ),
        });
      } else if (response?.data?.skill_unlocked !== undefined) {
        dispatch({
          type: "SYNC_STUDENTS",
          updater: (prev) =>
            prev.map((s) => ({ ...s, skill_unlocked: response.data.skill_unlocked })),
        });
      }
    });

    listen("perk-approve-request", (response: any) => {
      const perkId: string | undefined = response?.data?.perk?.id;
      const studentName: string = response?.data?.name ?? "A student";
      const perkTitle: string = response?.data?.perk?.title ?? "a perk";
      toast.info(`${studentName} requested to activate "${perkTitle}"`);
      if (perkId) {
        dispatch({ type: "PERK_UPDATE_GLOBAL", perkId, changes: { perk_status: "pending" } });
      }
    });

    listen("trailblazer-scenario-chosen", (response: any) => {
      const perkId: string | undefined = response?.data?.perkId;
      if (perkId) {
        dispatch({ type: "PERK_UPDATE_GLOBAL", perkId, changes: { perk_status: "used", is_used: true } });
      }
    });

    listen("trendsetter-applied", (response: any) => {
      const diplomatId: string | undefined = response?.data?.diplomat?.id;
      const victimId: string | undefined = response?.data?.victim?.id;
      const lostMS: number = response?.data?.victim?.lostMS ?? 1;
      const adjustments = [];
      if (diplomatId) adjustments.push({ studentId: diplomatId, delta: 1 });
      if (victimId) adjustments.push({ studentId: victimId, delta: -lostMS });
      if (adjustments.length) dispatch({ type: "MS_ADJUST", adjustments });
    });

    listen("perk-action-confirmation", (response: any) => {
      void fetchStudents();
      if (response?.success === false) {
        toast.error(response.message || "Something went wrong activating this perk. Please try again.");
        const failedPerkId: string | undefined =
          response?.data?.perkId ?? response?.perkId;
        const entriesToRevert = failedPerkId
          ? pendingPerkActionsRef.current.has(failedPerkId)
            ? [[failedPerkId, pendingPerkActionsRef.current.get(failedPerkId)!] as const]
            : []
          : [...pendingPerkActionsRef.current.entries()];

        for (const [perkId, { studentId, previousStatus }] of entriesToRevert) {
          dispatch({
            type: "PERK_UPDATE_STUDENT",
            studentId,
            perkId,
            changes: { perk_status: previousStatus },
          });
          pendingPerkActionsRef.current.delete(perkId);
        }
      } else if (response?.action === "approved") {
        const successPerkId: string | undefined =
          response?.data?.perkId ?? response?.perkId;
        if (successPerkId) pendingPerkActionsRef.current.delete(successPerkId);
      }
    });

    listen("perk-activated", (response: any) => {
      if (!response?.success) return;
      const perkId = response?.data?.perkId;
      const perkStatus = response?.data?.perk_status;
      const effects = response?.data?.effects;
      if (!perkId) return;

      dispatch({
        type: "PERK_UPDATE_GLOBAL",
        perkId,
        changes: { perk_status: perkStatus, is_used: perkStatus === "used" },
      });

      if (!effects) return;

      // Double Down: baron steals runner-up's entire MS
      if (effects.baronId && effects.stolenFrom !== undefined && effects.stolenAmount !== undefined) {
        dispatch({
          type: "SYNC_STUDENTS",
          updater: (prev) =>
            prev.map((s) => {
              if (s.id === effects.baronId) return { ...s, ms: (s.ms ?? 0) + effects.stolenAmount };
              if (s.id === effects.stolenFrom) return { ...s, ms: 0 };
              return s;
            }),
        });
      }

      // Corporate Empire / Compounding Gains: available skill points
      if (effects?.available_points !== undefined && effects.studentId) {
        dispatch({
          type: "AVAILABLE_POINTS_SYNC",
          studentId: effects.studentId,
          available_points: effects.available_points,
        });
      }

      // Rallying Cry / Strategic Rebirth: temporarily unlock skills
      if (effects.shiftingEnabled && effects.studentId) {
        dispatch({
          type: "SKILL_UNLOCKED_SET",
          studentId: effects.studentId,
          value: true,
        });
      }
    });

    listen("moment-of-glory", (response: any) => {
      if (!response?.success) return;
      const student = response?.data?.student;
      if (student) {
        toast.info(
          `Moment of Glory: ${student.name} requests a MS adjustment (current MS: ${student.marketShare})`,
        );
      }
    });

    listen("perk-cancelled-announcement", (response: any) => {
      const { rivalStudentId, rivalPerkId, rival, perk } = response?.data ?? {};
      toast.info(`${rival ?? "A student"}'s "${perk ?? "perk"}" was cancelled by Revered Icon`);
      if (rivalStudentId && rivalPerkId) {
        dispatch({
          type: "PERK_UPDATE_STUDENT",
          studentId: rivalStudentId,
          perkId: rivalPerkId,
          changes: { perk_status: null, is_approved: false },
        });
      }
    });

    listen("perks-auto-unlocked", (response: any) => {
      if (!response?.success) return;
      const { studentId, perkIds } = response.data ?? {};
      if (!studentId || !perkIds?.length) return;
      dispatch({ type: "PERKS_AUTO_UNLOCKED", studentId, perkIds });
    });

    listen("perk-used", (response: any) => {
      if (!response?.success) return;
      void fetchStudents();
      const perkId: string | undefined = response?.data?.perkId;
      const studentId: string | undefined = response?.data?.studentId;
      if (perkId && studentId) {
        dispatch({
          type: "PERK_UPDATE_STUDENT",
          studentId,
          perkId,
          changes: { is_used: true, is_approved: false, perk_status: null },
        });
      }
    });

    listen("perk-cancel-confirmed", (response: any) => {
      if (!response?.success) {
        toast.error(response?.message || "Unable to cancel this perk.");
        void fetchStudents();
        return;
      }
      const perkId: string | undefined = response?.data?.perkId;
      if (!perkId) return;
      dispatch({
        type: "PERK_UPDATE_GLOBAL",
        perkId,
        changes: { perk_status: null, is_used: false, is_approved: false },
      });
    });

    listen("skill-updated", (response: any) => {
      const studentId: string | undefined = response?.studentId;
      const updates: { skillId: string; value: number }[] = response?.updates ?? [];
      if (!studentId) return;
      if (updates.length === 0) {
        fetchStudents();
        return;
      }
      dispatch({ type: "SKILL_ENTRIES_UPDATE", studentId, updates });
      void fetchStudents();
    });

    const refreshPerks = () => { void fetchStudents(); };
    listen("scenario-temporary-effects-ended", refreshPerks);

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [socket, classId, teacherId, dispatch, pendingPerkActionsRef, fetchStudents]);
}
