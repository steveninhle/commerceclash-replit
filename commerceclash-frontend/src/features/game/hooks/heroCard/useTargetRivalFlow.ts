import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { TargetRivalModalData } from "./usePerkActivatedDispatcher";
import { usePerkSubmission } from "./usePerkSubmission";
import { usePerkSelectionInvalidation } from "./usePerkSelectionInvalidation";

export function useTargetRivalFlow({ socket, courseId, studentId, onRefresh }: {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  onRefresh?: () => void;
}) {
  const [targetRivalModalOpen, setTargetRivalModalOpen] = useState(false);
  const [targetRivalModalData, setTargetRivalModalData] = useState<TargetRivalModalData | null>(null);
  const { isSubmitting: isSelectingTargetRival, pending, begin, finish } = usePerkSubmission(socket, onRefresh);
  const resetSelection = useCallback(() => {
    finish();
    setTargetRivalModalOpen(false);
    setTargetRivalModalData(null);
  }, [finish]);
  usePerkSelectionInvalidation(socket, targetRivalModalData?.perkId ?? null, targetRivalModalData?.perkKey, resetSelection);

  const handleSelectTargetRival = (targetStudentId: string) => {
    if (!targetRivalModalData || !courseId) return;
    if (!targetRivalModalData.rivals.some((rival) => rival.id === targetStudentId)) {
      toast.error("Choose an eligible rival.");
      return;
    }
    if (!begin()) return;
    socket.emit("perk-complete-with-target", {
      classId: courseId, studentId, perkId: targetRivalModalData.perkId, targetStudentId,
    });
  };
  useEffect(() => {
    const completed = (response: { data?: { perkId?: string } }) => {
      if (targetRivalModalData && response.data?.perkId === targetRivalModalData.perkId) finish();
    };
    const scenarioEnded = (response: { success?: boolean }) => {
      if (!response.success || targetRivalModalData?.perkKey !== "extortion") return;
      finish();
      setTargetRivalModalOpen(false);
      setTargetRivalModalData(null);
      onRefresh?.();
    };
    socket.on("perk-activated", completed);
    socket.on("perk-activation-error", completed);
    socket.on("scenario-temporary-effects-ended", scenarioEnded);
    return () => {
      socket.off("perk-activated", completed);
      socket.off("perk-activation-error", completed);
      socket.off("scenario-temporary-effects-ended", scenarioEnded);
    };
  }, [socket, targetRivalModalData, finish, onRefresh]);

  const handleCloseTargetRivalModal = () => {
    if (pending.current) return;
    // Closing a picker does not consume or revoke server approval.
    setTargetRivalModalOpen(false);
  };
  return {
    targetRivalModalOpen, setTargetRivalModalOpen, targetRivalModalData,
    setTargetRivalModalData, isSelectingTargetRival, handleSelectTargetRival,
    handleCloseTargetRivalModal,
  };
}
