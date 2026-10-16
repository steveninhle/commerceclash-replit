import { useEffect } from "react";
import type { Socket } from "socket.io-client";

// A picker must not retain an approval revoked by the instructor.
export function usePerkSelectionInvalidation(
  socket: Socket,
  perkId: string | null,
  perkKey: string | undefined,
  reset: () => void,
) {
  useEffect(() => {
    const invalidated = (response: {
      success?: boolean;
      data?: { perkId?: string; perkKey?: string; perk_status?: string; action?: string };
    }) => {
      const data = response.data;
      if (!response.success || !data || !perkId) return;
      if (data.perkId ? data.perkId !== perkId : data.perkKey !== perkKey) return;
      if (data.action === "lock" || data.action === "reset" ||
          data.perk_status === "reset" || data.perk_status === "denied") reset();
    };
    const cancelled = (response: { success?: boolean; data?: { perkId?: string } }) => {
      if (response.success && perkId && response.data?.perkId === perkId) reset();
    };
    socket.on("perk-updated", invalidated);
    socket.on("perk-status-changed", invalidated);
    socket.on("perk-denied", invalidated);
    socket.on("perk-cancel-confirmed", cancelled);
    return () => {
      socket.off("perk-updated", invalidated);
      socket.off("perk-status-changed", invalidated);
      socket.off("perk-denied", invalidated);
      socket.off("perk-cancel-confirmed", cancelled);
    };
  }, [socket, perkId, perkKey, reset]);
}
