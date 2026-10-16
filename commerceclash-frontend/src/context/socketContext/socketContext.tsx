import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

const CONNECTION_URL = import.meta.env.VITE_BASE_URL;
if (!CONNECTION_URL) throw new Error("VITE_BASE_URL is not defined");

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);

  if (socketRef.current === null) {
    const cleanUrl = CONNECTION_URL.replace(/\/+$/, "");
    socketRef.current = io(cleanUrl, {
      autoConnect: true,
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: (cb) => {
        try {
          const token = localStorage.getItem("access_token");
          cb({ accessToken: token || undefined });
        } catch {
          cb({});
        }
      },
    });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    if (!socket.connected) {
      socket.connect();
    }
    const handleConnectError = (err: Error) => {
      console.warn("[socket] connect error:", err.message);
    };
    const handleReconnectFailed = () => {
      console.error("[socket] reconnect failed");
    };

    socket.on("connect_error", handleConnectError);
    socket.on("reconnect_failed", handleReconnectFailed);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect_failed", handleReconnectFailed);
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};