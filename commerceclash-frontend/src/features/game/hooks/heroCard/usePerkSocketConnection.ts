import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";

interface UsePerkSocketConnectionOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
}

// Tracks WebSocket connect/disconnect state and queues perk-approval requests
// made while offline so they can be flushed once the connection recovers.
export const usePerkSocketConnection = ({
  socket,
  courseId,
  studentId,
}: UsePerkSocketConnectionOptions) => {
  const [isConnected, setIsConnected] = useState(() => Boolean(socket?.connected));
  const [pendingRequests, setPendingRequests] = useState<
    Array<{ perkId: string; title: string }>
  >([]);
  const pendingRequestsRef = useRef(pendingRequests);
  pendingRequestsRef.current = pendingRequests;
  const courseIdRef = useRef(courseId);
  courseIdRef.current = courseId;
  const studentIdRef = useRef(studentId);
  studentIdRef.current = studentId;
  const lastErrorToastRef = useRef<number>(0);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      // Process any pending requests
      if (pendingRequestsRef.current.length > 0) {
        toast.info(`Sending ${pendingRequestsRef.current.length} queued request(s)...`);
        pendingRequestsRef.current.forEach(({ perkId, title }) => {
          socket.emit("perk-approve-request", {
            classId: courseIdRef.current,
            studentId: studentIdRef.current,
            perk: { id: perkId, title: title },
          });
        });
        setPendingRequests([]);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      toast.error("Connection lost. Attempting to reconnect...");
    };

    const handleConnectError = (error: Error) => {
      console.error("Connection error:", error);
      setIsConnected(false);
      const now = Date.now();
      if (now - lastErrorToastRef.current > 4000) {
        lastErrorToastRef.current = now;
        toast.error("Unable to connect. Please check your connection.");
      }
    };

    const handleReconnect = (attemptNumber: number) => {
      toast.info(`Reconnected after ${attemptNumber} attempt(s)`);
      setIsConnected(true);
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      if (attemptNumber === 1) {
        toast.info("Attempting to reconnect...");
      }
    };

    const handleReconnectError = (error: Error) => {
      console.error("Reconnection error:", error);
    };

    const handleReconnectFailed = () => {
      toast.error("Unable to reconnect. Please refresh the page.");
    };

    // Handle general WebSocket errors
    const handleWsError = (data: { message?: string }) => {
      toast.error(data.message || "Something went wrong. Please try again.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect", handleReconnect);
    socket.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("reconnect_error", handleReconnectError);
    socket.on("reconnect_failed", handleReconnectFailed);
    socket.on("ws-error", handleWsError);

    // Set initial connection state and proactively connect if disconnected
    setIsConnected(Boolean(socket.connected));
    if (!socket.connected && typeof socket.connect === "function") {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect", handleReconnect);
      socket.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("reconnect_error", handleReconnectError);
      socket.off("reconnect_failed", handleReconnectFailed);
      socket.off("ws-error", handleWsError);
    };
  }, [socket]);

  return { isConnected, pendingRequests, setPendingRequests };
};
