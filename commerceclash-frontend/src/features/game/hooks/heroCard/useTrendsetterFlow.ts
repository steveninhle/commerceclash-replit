import { useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { TrendsetterRival, Perk, PerkCompleteWithTargetPayload } from "./types";

interface UseTrendsetterFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  clearStatus: (perkId: string) => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

// Trendsetter: the perk owner already gained Market Share; they now pick
// which rival loses Market Share to complete the effect.
export const useTrendsetterFlow = ({
  socket,
  courseId,
  studentId,
  clearStatus,
  onPerkUpdate,
}: UseTrendsetterFlowOptions) => {
  const [trendsetterModalOpen, setTrendsetterModalOpen] = useState(false);
  const [trendsetterRivals, setTrendsetterRivals] = useState<
    TrendsetterRival[]
  >([]);
  const [trendsetterPerkId, setTrendsetterPerkId] = useState<string | null>(
    null,
  );
  const [trendsetterGained, setTrendsetterGained] = useState<number>(1);
  const [trendsetterNewMS, setTrendsetterNewMS] = useState<number | undefined>(
    undefined,
  );
  const [isSelectingTrendsetterTarget, setIsSelectingTrendsetterTarget] =
    useState(false);

  // Handle Trendsetter target selection
  const handleTrendsetterTargetSelect = (targetId: string) => {
    if (!trendsetterPerkId || !courseId || isSelectingTrendsetterTarget) return;

    setIsSelectingTrendsetterTarget(true);
    toast.info("Applying Trendsetter effect...");

    // Send the target selection to complete Trendsetter
    const payload: PerkCompleteWithTargetPayload = {
      classId: courseId,
      studentId,
      perkId: trendsetterPerkId,
      targetStudentId: targetId,
    };
    socket.emit("perk-complete-with-target", payload);

    // Note: Modal will be closed when perk-activated event is received
    setTimeout(() => {
      if (isSelectingTrendsetterTarget) {
        setTrendsetterModalOpen(false);
        setTrendsetterRivals([]);
        setTrendsetterPerkId(null);
        setIsSelectingTrendsetterTarget(false);
      }
    }, 5000);
  };

  const handleCloseTrendsetterModal = () => {
    setTrendsetterModalOpen(false);
    setTrendsetterRivals([]);
    setIsSelectingTrendsetterTarget(false);
    // Note: +1 MS was already given, but rival selection was cancelled
    // The perk will remain in an incomplete state until next class
    if (trendsetterPerkId) {
      clearStatus(trendsetterPerkId);
      onPerkUpdate?.(
        { id: trendsetterPerkId },
        { status: null, used: false },
      );
    }
    setTrendsetterPerkId(null);
  };

  return {
    trendsetterModalOpen,
    setTrendsetterModalOpen,
    trendsetterRivals,
    setTrendsetterRivals,
    trendsetterPerkId,
    setTrendsetterPerkId,
    trendsetterGained,
    setTrendsetterGained,
    trendsetterNewMS,
    setTrendsetterNewMS,
    isSelectingTrendsetterTarget,
    setIsSelectingTrendsetterTarget,
    handleTrendsetterTargetSelect,
    handleCloseTrendsetterModal,
  };
};
