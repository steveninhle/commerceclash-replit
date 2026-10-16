import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";

// Socket events have no request acknowledgement callback. Keep a synchronous
// lock until the result event arrives; never retry an uncertain mutation.
export function usePerkSubmission(socket: Socket, onRefresh?: () => void) {
  const pending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const finish = useCallback(() => {
    pending.current = false;
    clearTimeout(timer.current);
    timer.current = undefined;
    setIsSubmitting(false);
  }, []);
  const begin = useCallback(() => {
    if (pending.current) return false;
    if (!socket.connected) {
      toast.error("Connect to the class before using this perk.");
      return false;
    }
    pending.current = true;
    setIsSubmitting(true);
    // Allow the backend's ten-second interception window to finish first.
    timer.current = setTimeout(() => {
      timer.current = undefined;
      toast.error("No result received. Refreshing server state; the action may still complete.");
      onRefresh?.();
    }, 30_000);
    return true;
  }, [socket, onRefresh]);
  useEffect(() => {
    const interrupted = () => {
      if (!pending.current) return;
      finish();
      onRefresh?.();
    };
    socket.on("disconnect", interrupted);
    return () => {
      socket.off("disconnect", interrupted);
    };
  }, [socket, finish, onRefresh]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { isSubmitting, pending, begin, finish };
}
