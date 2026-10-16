import { usePerkSubmission } from "./usePerkSubmission";
import { usePerkSelectionInvalidation } from "./usePerkSelectionInvalidation";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type {
  DangerZonePhaseData,
  Perk,
  SkillDeduction,
  PerkCompleteWithTargetPayload,
  PerkCancelPayload,
} from "./types";

interface UseDangerZoneFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  clearStatus: (perkId: string) => void;
  onRefresh?: () => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

export const useDangerZoneFlow = ({
  socket,
  courseId,
  studentId,
  clearStatus,
  onRefresh,
}: UseDangerZoneFlowOptions) => {
  const [dangerZoneModalOpen, setDangerZoneModalOpen] = useState(false);
  const [dangerZonePhaseData, setDangerZonePhaseData] =
    useState<DangerZonePhaseData | null>(null);
  const [dangerZonePerkId, setDangerZonePerkId] = useState<string | null>(null);
  const { isSubmitting: isSubmittingDangerZone, pending, begin, finish } = usePerkSubmission(socket, onRefresh);

  const cancelling = useRef(false);
  const resetSelection = useCallback(() => {
    finish();
    cancelling.current = false;
    setDangerZoneModalOpen(false);
    setDangerZonePhaseData(null);
    setDangerZonePerkId(null);
  }, [finish]);
  usePerkSelectionInvalidation(socket, dangerZonePerkId, "danger_zone", resetSelection);

  useEffect(() => {
    const completed = (response: { data?: { perkId?: string } }) => {
      if (response.data?.perkId === dangerZonePerkId)
        finish();
    };
    const cancelled = (response: { success?: boolean; message?: string; data?: { perkId?: string } }) => {
      if (!cancelling.current || response.data?.perkId !== dangerZonePerkId) return;
      cancelling.current = false;
      finish();
      if (response.success) {
        clearStatus(dangerZonePerkId!);
        resetSelection();
        onRefresh?.();
      } else {
        setDangerZoneModalOpen(true);
        toast.error(response.message || "Failed to cancel perk.");
      }
    };
    const disconnected = () => { cancelling.current = false; finish(); };
    socket.on("perk-activated", completed);
    socket.on("perk-activation-error", completed);
    socket.on("disconnect", disconnected);
    socket.on("perk-cancel-confirmed", cancelled);
    return () => {
      socket.off("perk-activated", completed);
      socket.off("perk-activation-error", completed);
      socket.off("disconnect", disconnected);
      socket.off("perk-cancel-confirmed", cancelled);
    };
  }, [socket, dangerZonePerkId, finish, clearStatus, resetSelection, onRefresh]);

  const handleSubmitDangerZone = useCallback(
    (targetStudentId: string, skillDeductions: SkillDeduction[]) => {
      if (!dangerZonePerkId || !courseId || !dangerZonePhaseData) return;
      const ids = new Set(skillDeductions.map((item) => item.skillId));
      if (
        !dangerZonePhaseData.rivals.some((rival) => rival.id === targetStudentId) ||
        ids.size !== skillDeductions.length ||
        skillDeductions.reduce((sum, item) => sum + item.amount, 0) !== dangerZonePhaseData.pointsToRemove ||
        skillDeductions.some((item) => !Number.isInteger(item.amount) || item.amount <= 0 ||
          !dangerZonePhaseData.skillTree.some((skill) => skill.skillId === item.skillId && skill.currentValue >= item.amount))
      ) {
        toast.error("Choose an eligible rival and the required available skill points.");
        return;
      }

      if (!begin()) return;
      toast.info("Executing Danger Zone gambit...");

      const payload: PerkCompleteWithTargetPayload = {
        classId: courseId,
        studentId,
        perkId: dangerZonePerkId,
        targetStudentId,
        skillDeductions,
      };
      socket.emit("perk-complete-with-target", payload);
    },
    [socket, courseId, studentId, dangerZonePerkId, dangerZonePhaseData, begin],
  );

  const handleCloseDangerZoneModal = useCallback(() => {
    if (pending.current) return;
    if (!socket.connected) {
      toast.error("Reconnect before cancelling this perk.");
      return;
    }
    if (!dangerZonePerkId || !courseId || !begin()) return;
    cancelling.current = true;
    setDangerZoneModalOpen(false);
    const cancelPayload: PerkCancelPayload = {
      classId: courseId,
      studentId,
      perkId: dangerZonePerkId,
      perkKey: "danger_zone",
    };
    // Keep the picker until cancellation is acknowledged; a rejected cancel
    // restores the same server-approved selection instead of losing it.
    socket.emit("perk-cancel", cancelPayload);
  }, [socket, courseId, studentId, dangerZonePerkId, pending, begin]);

  return {
    dangerZoneModalOpen,
    setDangerZoneModalOpen,
    dangerZonePhaseData,
    setDangerZonePhaseData,
    dangerZonePerkId,
    setDangerZonePerkId,
    isSubmittingDangerZone,
    handleSubmitDangerZone,
    handleCloseDangerZoneModal,
  };
};
