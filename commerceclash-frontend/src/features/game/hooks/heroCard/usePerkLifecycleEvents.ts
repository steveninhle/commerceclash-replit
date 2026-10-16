import { useEffect } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { Perk } from "./types";

interface UsePerkLifecycleEventsOptions {
  socket: Socket;
  onRefresh?: () => void;
  courseId: string | null;
  studentId: string;
  clearStatus: (perkId: string) => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

// Perk state changes pushed by the teacher/server outside of this student's
// own activation flow: unlocked, approved/denied/reset by teacher, denied by
// server, or errored during activation.
export const usePerkLifecycleEvents = ({
  socket,
  onRefresh,
  courseId,
  studentId,
  clearStatus,
  onPerkUpdate,
}: UsePerkLifecycleEventsOptions) => {
  // Listen for perk-unlocked and perk-status-changed events from teacher
  useEffect(() => {
    const handlePerkUnlocked = (data: {
      data?: { perkId?: string; title?: string };
    }) => {
      // toast.success(`🔓 Perk "${data.data?.title}" has been unlocked!`);
      onPerkUpdate?.({ id: data.data?.perkId }, { is_unlocked: true });
      onRefresh?.();
    };

    const handlePerkStatusChanged = (data: {
      data?: {
        perkId?: string;
        perk_status?: string;
        title?: string;
        perkKey?: string;
      };
    }) => {
      const status = data.data?.perk_status;
      onRefresh?.();
      if (status === "approved") {
        // toast.success(`✅ Perk "${data.data?.title}" approved by teacher`);
        onPerkUpdate?.(
          { id: data.data?.perkId },
          { status: "approved", approved: true },
        );
      } else if (status === "denied") {
        toast.error(
          `Your "${data.data?.title}" perk was denied by the teacher.`,
        );
        if (data.data?.perkKey === "corporate_espionage" && courseId) {
          localStorage.removeItem(`espionage_${courseId}_${studentId}`);
          window.dispatchEvent(new CustomEvent("espionage-denied"));
        }
        onPerkUpdate?.(
          { id: data.data?.perkId, key: data.data?.perkKey },
          { status: "denied", approved: false },
        );
      } else if (status === "reset") {
        toast.info(`↺ Perk "${data.data?.title}" has been reset`);
        if (data.data?.perkKey === "corporate_espionage" && courseId) {
          localStorage.removeItem(`espionage_${courseId}_${studentId}`);
          window.dispatchEvent(new CustomEvent("espionage-denied"));
        }
        onPerkUpdate?.(
          { id: data.data?.perkId, key: data.data?.perkKey },
          { status: null, used: false, approved: false },
        );
      }
    };

    socket.on("perk-unlocked", handlePerkUnlocked);
    socket.on("perk-status-changed", handlePerkStatusChanged);

    return () => {
      socket.off("perk-unlocked", handlePerkUnlocked);
      socket.off("perk-status-changed", handlePerkStatusChanged);
    };
  }, [socket, onRefresh, courseId, studentId, onPerkUpdate]);

  useEffect(() => {
    const handlePerkDenied = (data: {
      message?: string;
      data?: { perkId?: string; perkKey?: string };
    }) => {
      toast.error(
        data.message || "Your perk request was denied by the teacher.",
      );
      onRefresh?.();
      // Clear local state for this perk and refresh
      if (data.data?.perkId) {
        clearStatus(data.data.perkId);
      }
      // Notify Gamification to hide rival skill trees if Corporate Espionage was denied
      if (data.data?.perkKey === "corporate_espionage" && courseId) {
        localStorage.removeItem(`espionage_${courseId}_${studentId}`);
        window.dispatchEvent(new CustomEvent("espionage-denied"));
      }
      onPerkUpdate?.(
        { id: data.data?.perkId, key: data.data?.perkKey },
        { status: "denied", approved: false },
      );
    };

    socket.on("perk-denied", handlePerkDenied);

    return () => {
      socket.off("perk-denied", handlePerkDenied);
    };
  }, [socket, onRefresh, clearStatus, courseId, studentId, onPerkUpdate]);

  useEffect(() => {
    const cancelled = (response: {
      success?: boolean;
      message?: string;
      data?: { perkId?: string };
    }) => {
      if (response.data?.perkId) clearStatus(response.data.perkId);
      if (response.success === false)
        toast.error(response.message || "Unable to cancel this perk.");
      onRefresh?.();
    };
    socket.on("perk-cancel-confirmed", cancelled);
    return () => {
      socket.off("perk-cancel-confirmed", cancelled);
    };
  }, [socket, clearStatus, onRefresh]);

  // Listen for perk-activation-error event
  useEffect(() => {
    const handlePerkActivationError = (data: {
      message?: string;
      data?: { perkId?: string };
    }) => {
      toast.error(data.message || "Unable to activate this perk.");
      onRefresh?.();
      // Clear local state for this perk
      if (data.data?.perkId) {
        clearStatus(data.data.perkId);
      }
    };

    socket.on("perk-activation-error", handlePerkActivationError);

    return () => {
      socket.off("perk-activation-error", handlePerkActivationError);
    };
  }, [socket, onRefresh, clearStatus, courseId, studentId, onPerkUpdate]);
};
