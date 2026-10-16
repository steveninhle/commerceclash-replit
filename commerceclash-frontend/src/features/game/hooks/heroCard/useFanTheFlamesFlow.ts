import { usePerkSubmission } from "./usePerkSubmission";
import { usePerkSelectionInvalidation } from "./usePerkSelectionInvalidation";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { FanTheFlamesOffer } from "./types";

interface UseFanTheFlamesFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  perkId?: string | null;
  onRefresh?: () => void;
}

export const useFanTheFlamesFlow = ({
  socket,
  courseId,
  studentId,
  perkId,
  onRefresh,
}: UseFanTheFlamesFlowOptions) => {
  const [fanTheFlamesModalOpen, setFanTheFlamesModalOpen] = useState(false);
  const [fanTheFlamesOffer, setFanTheFlamesOffer] =
    useState<FanTheFlamesOffer | null>(null);
  const { isSubmitting: isRedirecting, pending, begin, finish } = usePerkSubmission(socket, onRefresh);
  const currentOffer = useRef<FanTheFlamesOffer | null>(null);
  const offers = useRef<FanTheFlamesOffer[]>([]);
  // Results omit pendingKey. Only one redirect may be in flight, including
  // after its display window expires, until that request receives a result.
  const submittedOffer = useRef<FanTheFlamesOffer | null>(null);
  const advance = useCallback(() => {
    const next = offers.current.find((offer) => offer.expiresAt > Date.now()) ?? null;
    offers.current = next ? offers.current.filter((offer) => offer !== next && offer.expiresAt > Date.now()) : [];
    currentOffer.current = next;
    setFanTheFlamesOffer(next);
    setFanTheFlamesModalOpen(!!next);
  }, []);
  const resetOffers = useCallback(() => {
    finish();
    offers.current = [];
    currentOffer.current = null;
    submittedOffer.current = null;
    setFanTheFlamesModalOpen(false);
    setFanTheFlamesOffer(null);
  }, [finish]);
  usePerkSelectionInvalidation(socket, perkId ?? null, "fan_the_flames", resetOffers);

  useEffect(() => {
    // 1. Offer received from server when an incoming MS loss happens
    const handleFanTheFlamesOffer = (response: {
      success: boolean;
      message?: string;
      data?: FanTheFlamesOffer;
    }) => {
      if (response.success && response.data) {
        // pendingKey is classId:studentId:timestamp in the BE contract.
        if (!courseId || !response.data.pendingKey.startsWith(`${courseId}:${studentId}:`)) return;
        if (response.data.expiresAt <= Date.now() || currentOffer.current?.pendingKey === response.data.pendingKey || offers.current.some((offer) => offer.pendingKey === response.data?.pendingKey)) return;
        offers.current.push(response.data);
        if (!currentOffer.current && !submittedOffer.current) advance();
        toast.warning(
          `🔥 ${response.data.attackerName}'s ${response.data.sourcePerkTitle} would cost you ${response.data.amount} MS! Redirect it?`,
          {
            duration: response.data.decisionWindowMs,
          },
        );
      }
    };

    // 2. Decision window expired without a redirect
    const handleFanTheFlamesExpired = (response: { message?: string; data?: { pendingKey?: string } }) => {
      const key = response.data?.pendingKey;
      offers.current = offers.current.filter((offer) => offer.pendingKey !== key);
      if (key !== currentOffer.current?.pendingKey) return;
      if (submittedOffer.current?.pendingKey === key) {
        currentOffer.current = null;
        setFanTheFlamesOffer(null);
        setFanTheFlamesModalOpen(false);
      } else {
        advance();
      }
      toast.info(
        response.message || "Redirect window expired; waiting for the attack result.",
      );
      onRefresh?.();
    };

    // 3. Result of redirect submission
    const handleFanTheFlamesRedirectResult = (response: {
      success: boolean;
      message?: string;
      data?: {
        redirectedTo: string;
        redirectedToName?: string;
        amount: number;
      };
    }) => {
      const submitted = submittedOffer.current;
      if (!submitted) return;
      submittedOffer.current = null;
      finish();
      if (response.success) {
        if (currentOffer.current?.pendingKey === submitted.pendingKey) currentOffer.current = null;
        if (!currentOffer.current) advance();
        toast.info(
          response.message ||
            `Redirect accepted for ${response.data?.redirectedToName ?? "the selected rival"}; waiting for the effect.`,
        );
        onRefresh?.();
      } else {
        toast.error(response.message || "Failed to redirect MS loss.");
        if (!currentOffer.current || currentOffer.current.expiresAt <= Date.now()) advance();
      }
    };

    // 4. Notification when another player redirects their MS loss to this student
    const handleRedirectedToYou = (response: {
      success: boolean;
      message?: string;
      data?: { amount: number; sourcePerkTitle: string };
    }) => {
      if (!response.success) return;
      toast.info(
        response.message ||
          `Fan the Flames selected you as the target. Waiting for the effect.`,
      );
      onRefresh?.();
    };

    socket.on("disconnect", resetOffers);
    socket.on("fan-the-flames-offer", handleFanTheFlamesOffer);
    socket.on("fan-the-flames-expired", handleFanTheFlamesExpired);
    socket.on(
      "fan-the-flames-redirect-result",
      handleFanTheFlamesRedirectResult,
    );
    socket.on("fan-the-flames-redirected-to-you", handleRedirectedToYou);

    return () => {
      socket.off("disconnect", resetOffers);
      socket.off("fan-the-flames-offer", handleFanTheFlamesOffer);
      socket.off("fan-the-flames-expired", handleFanTheFlamesExpired);
      socket.off(
        "fan-the-flames-redirect-result",
        handleFanTheFlamesRedirectResult,
      );
      socket.off("fan-the-flames-redirected-to-you", handleRedirectedToYou);
    };
  }, [socket, onRefresh, courseId, studentId, finish, advance, resetOffers]);

  const handleFanTheFlamesRedirect = useCallback(
    (targetStudentId: string) => {
      const offer = currentOffer.current;
      if (submittedOffer.current) return;
      if (!offer || !courseId || offer.expiresAt <= Date.now()) return;
      if (!offer.rivals.some((rival) => rival.id === targetStudentId)) {
        toast.error("Choose an eligible redirect target.");
        return;
      }
      if (!socket.connected) {
        toast.error("Connect to the class before redirecting a loss.");
        return;
      }

      if (!begin()) return;
      submittedOffer.current = offer;
      toast.info("Redirecting MS loss to selected rival...");

      socket.emit("fan-the-flames-redirect", {
        classId: courseId,
        pendingKey: offer.pendingKey,
        targetStudentId,
      });
    },
    [socket, courseId, begin],
  );

  const handleCloseFanTheFlamesModal = useCallback(() => {
    if (pending.current || submittedOffer.current) return;
    advance();
  }, [pending, advance]);

  return {
    fanTheFlamesModalOpen,
    fanTheFlamesOffer,
    isRedirecting,
    handleFanTheFlamesRedirect,
    handleCloseFanTheFlamesModal,
  };
};
