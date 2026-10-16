import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { ReveredIconPendingPerk } from "./types";

interface UseReveredIconFlowOptions {
  socket: Socket;
  onRefresh?: () => void;
  characterTitle: string;
  courseId: string | null;
  studentId: string;
}

// Handles Revered Icon events (for Commanders): a rival activates a perk and
// this Commander gets a time-limited window to cancel it.
export const useReveredIconFlow = ({
  socket,
  onRefresh,
  characterTitle,
  courseId,
  studentId,
}: UseReveredIconFlowOptions) => {
  const [reveredIconModalOpen, setReveredIconModalOpen] = useState(false);
  const [reveredIconPending, setReveredIconPending] =
    useState<ReveredIconPendingPerk | null>(null);
  const [isCancellingPerk, setIsCancellingPerk] = useState(false);

  useEffect(() => {
    // When a rival activates a perk and this Commander can cancel it
    const handleRivalPerkPending = (data: {
      success: boolean;
      message?: string;
      data?: ReveredIconPendingPerk;
    }) => {
      if (data.success && data.data) {
        setReveredIconPending(data.data);
        setReveredIconModalOpen(true);
        toast.warning(
          `⚔️ ${data.data.rival.name} is using ${data.data.perk.title}! Cancel it?`,
          {
            duration: data.data.cancelWindowMs,
          },
        );
      }
    };

    // When time expires and the perk proceeds
    const handleReveredIconExpired = (data: { message?: string }) => {
      setReveredIconModalOpen(false);
      setReveredIconPending(null);
      toast.info(data.message || "Time expired - rival perk activated");
    };

    // When Commander successfully cancels a perk
    const handleReveredIconCancelResult = () => {
      setIsCancellingPerk(false);
      setReveredIconModalOpen(false);
      setReveredIconPending(null);

      // if (data.success) {
      //   toast.success(`🛡️ ${data.message}`);
      // } else {
      //   toast.error(data.message || "Failed to cancel perk");
      // }
    };

    // When this student's perk was cancelled by a Commander
    const handlePerkCancelledByCommander = (data: {
      message?: string;
      data?: { perkTitle: string; cancelledBy: string };
    }) => {
      toast.error(data.message || "Your perk was cancelled by a Commander.");
      onRefresh?.();
    };

    // Class-wide announcement when a perk is cancelled
    const handlePerkCancelledAnnouncement = (data: {
      message?: string;
      data?: { commander: string; rival: string; perk: string };
    }) => {
      // Only show if not the commander or rival (they already got specific notifications)
      if (
        data.data &&
        data.data.commander !== characterTitle &&
        data.data.rival !== characterTitle
      ) {
        toast.info(`⚔️ ${data.message}`);
      }
    };

    socket.on("rival-perk-pending", handleRivalPerkPending);
    socket.on("revered-icon-expired", handleReveredIconExpired);
    socket.on("revered-icon-cancel-result", handleReveredIconCancelResult);
    socket.on("perk-cancelled-by-commander", handlePerkCancelledByCommander);
    socket.on("perk-cancelled-announcement", handlePerkCancelledAnnouncement);

    return () => {
      socket.off("rival-perk-pending", handleRivalPerkPending);
      socket.off("revered-icon-expired", handleReveredIconExpired);
      socket.off("revered-icon-cancel-result", handleReveredIconCancelResult);
      socket.off("perk-cancelled-by-commander", handlePerkCancelledByCommander);
      socket.off(
        "perk-cancelled-announcement",
        handlePerkCancelledAnnouncement,
      );
    };
  }, [socket, onRefresh, characterTitle]);

  const handleReveredIconCancel = (pendingKey: string) => {
    if (isCancellingPerk || !reveredIconPending) return;

    setIsCancellingPerk(true);
    toast.info("Cancelling rival's perk...");

    socket.emit("revered-icon-cancel", {
      classId: courseId,
      commanderId: studentId,
      pendingPerkKey: pendingKey,
    });
  };

  const handleCloseReveredIconModal = () => {
    setReveredIconModalOpen(false);
  };

  return {
    reveredIconModalOpen,
    reveredIconPending,
    isCancellingPerk,
    handleReveredIconCancel,
    handleCloseReveredIconModal,
  };
};
