import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { Character, Perk } from "./types";
import { isPerkAvailableAtLevel } from "../../utils/perkState";

interface UsePerkOptimisticStatusOptions {
  character: Character;
  socket: Socket;
  courseId: string | null;
  studentId: string;
  isConnected: boolean;
  studentLevel?: number;
  queuePendingRequest: (request: { perkId: string; title: string }) => void;
  onRefresh?: () => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

// "requesting" is transport loading; only a server acknowledgement sets "pending".
export const usePerkOptimisticStatus = ({
  character,
  socket,
  courseId,
  studentId,
  isConnected,
  studentLevel,
  onRefresh,
  onPerkUpdate,
}: UsePerkOptimisticStatusOptions) => {
  const [localPerkStatuses, setLocalPerkStatuses] = useState<
    Record<string, string>
  >({});
  const requests = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearStatus = useCallback((perkId: string) => {
    clearTimeout(requests.current.get(perkId));
    requests.current.delete(perkId);
    setLocalPerkStatuses((prev) => {
      const next = { ...prev };
      delete next[perkId];
      return next;
    });
  }, []);

  useEffect(() => {
    type Result = {
      success?: boolean;
      message?: string;
      data?: { perkId?: string };
    };
    const acknowledged = (response: Result) => {
      const id = response.data?.perkId;
      if (!id || !requests.current.has(id)) return;
      clearStatus(id);
      if (response.success === true) {
        onPerkUpdate?.({ id }, { status: "pending", approved: false });
      } else {
        toast.error(response.message || "Unable to request this perk.");
      }
      onRefresh?.();
    };
    const failed = (response: Result) => {
      const ids = response.data?.perkId
        ? [response.data.perkId]
        : [...requests.current.keys()];
      ids.forEach(clearStatus);
      onRefresh?.();
    };
    const activated = (response: Result) => {
      if (response.data?.perkId) clearStatus(response.data.perkId);
    };
    const disconnected = () => {
      [...requests.current.keys()].forEach(clearStatus);
      onRefresh?.();
    };
    socket.on("perk-request-sent", acknowledged);
    socket.on("perk-request-confirmation", acknowledged);
    socket.on("perk-activation-error", failed);
    socket.on("ws-error", failed);
    socket.on("perk-activated", activated);
    socket.on("disconnect", disconnected);
    return () => {
      socket.off("perk-request-sent", acknowledged);
      socket.off("perk-request-confirmation", acknowledged);
      socket.off("perk-activation-error", failed);
      socket.off("ws-error", failed);
      socket.off("perk-activated", activated);
      socket.off("disconnect", disconnected);
    };
  }, [socket, clearStatus, onPerkUpdate, onRefresh]);

  useEffect(() => {
    const pending = requests.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const getEffectiveStatus = (perk: Perk) =>
    localPerkStatuses[perk.id] || perk.status;

  const approvePerk = (perkId: string, title: string) => {
    const perk = character.perks.find((item) => item.id === perkId);
    if (
      !perk ||
      !isPerkAvailableAtLevel(perk, studentLevel) ||
      perk.used ||
      perk.approved ||
      perk.status === "pending" ||
      requests.current.has(perkId)
    )
      return;
    const effectiveCourseId =
      courseId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("courseId") ||
          new URLSearchParams(window.location.search).get("classId") ||
          (typeof localStorage !== "undefined"
            ? localStorage.getItem("currentCourseId") ||
              localStorage.getItem("activeCourseId") ||
              (new URLSearchParams(window.location.search).get("meetingId")
                ? localStorage.getItem(
                    `meeting_${new URLSearchParams(window.location.search).get("meetingId")}_courseId`,
                  )
                : null)
            : null)
        : null);

    const effectiveStudentId =
      studentId ||
      (typeof localStorage !== "undefined"
        ? (() => {
            try {
              const u = localStorage.getItem("user");
              const parsedUser = u ? JSON.parse(u) : null;
              const rawId = localStorage.getItem("id");
              let parsedId = null;
              if (rawId) {
                try {
                  parsedId = JSON.parse(rawId);
                } catch {
                  parsedId = rawId;
                }
              }
              return (
                (typeof parsedUser === "object" ? parsedUser?.id : null) ||
                (typeof parsedId === "string" ? parsedId : null) ||
                null
              );
            } catch {
              return null;
            }
          })()
        : null);

    if (!effectiveCourseId || !effectiveStudentId) {
      toast.error("Connect to the class before requesting a perk.");
      return;
    }

    if (!isConnected || !socket.connected) {
      if (typeof socket.connect === "function") {
        socket.connect();
      }
      toast.error("Connecting to class server... please try again in a moment.");
      return;
    }

    setLocalPerkStatuses((prev) => ({ ...prev, [perkId]: "requesting" }));
    requests.current.set(
      perkId,
      setTimeout(() => {
        clearStatus(perkId);
        toast.error("Perk request timed out. Refreshing the server state.");
        onRefresh?.();
      }, 15_000),
    );

    socket.emit("perk-approve-request", {
      classId: effectiveCourseId,
      studentId: effectiveStudentId,
      perk: { id: perkId, title },
    });
  };

  return { localPerkStatuses, getEffectiveStatus, clearStatus, approvePerk };
};
