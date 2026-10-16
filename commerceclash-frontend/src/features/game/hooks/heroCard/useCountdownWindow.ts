import { useState, useEffect } from "react";

export interface UseCountdownWindowOptions {
  open: boolean;
  expiresAt: number;
  windowMs: number;
  onExpire?: () => void;
  intervalMs?: number;
}

export interface UseCountdownWindowResult {
  timeLeft: number;
  progress: number;
  secondsLeft: number;
  isExpired: boolean;
}

/**
 * Shared countdown window hook for real-time perk guardian/decision windows
 * (e.g. Revered Icon cancellation, Fan the Flames redirection).
 */
export function useCountdownWindow({
  open,
  expiresAt,
  windowMs,
  onExpire,
  intervalMs = 100,
}: UseCountdownWindowOptions): UseCountdownWindowResult {
  const [timeLeft, setTimeLeft] = useState<number>(() =>
    Math.max(0, expiresAt - Date.now())
  );
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!open) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);
      const safeWindow = windowMs > 0 ? windowMs : 10000;
      setProgress((remaining / safeWindow) * 100);

      if (remaining <= 0) {
        onExpire?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, intervalMs);

    return () => clearInterval(interval);
  }, [open, expiresAt, windowMs, onExpire, intervalMs]);

  const secondsLeft = Math.ceil(timeLeft / 1000);
  const isExpired = timeLeft <= 0;

  return {
    timeLeft,
    progress,
    secondsLeft,
    isExpired,
  };
}
