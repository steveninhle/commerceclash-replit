import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import type { Perk } from "./types";

export interface MasterpieceReward {
  perkId: string;
  pillar: string;
  pointsGained: number;
  poolAfterReward: number;
}

export function useMasterpieceFlow({ socket, courseId, studentId, perks }: {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  perks: Perk[];
}) {
  const queryClient = useQueryClient();
  const [rewards, setRewards] = useState<MasterpieceReward[]>([]);
  const recent = useRef(new Map<string, number>());

  useEffect(() => {
    recent.current.clear();
    setRewards([]);
  }, [courseId, studentId]);

  useEffect(() => {
    if (!courseId || !studentId) return;
    const activated = (response: {
      success?: boolean;
      data?: {
        studentId?: string;
        perkId?: string;
        perk_status?: string;
        effects?: {
          maxedSkillName?: string;
          pointsGained?: number;
          pointsBefore?: number;
          pointsAfter?: number;
          available_points?: number;
        };
      };
    }) => {
      const data = response.data;
      const effects = data?.effects;
      if (!response.success || data?.studentId !== studentId || data.perk_status !== "used" ||
          !perks.some(perk => perk.id === data.perkId && perk.key === "masterpiece")) return;
      if (!effects?.maxedSkillName?.trim() || effects.pointsGained !== 1 ||
          !Number.isInteger(effects.pointsBefore) || !Number.isInteger(effects.pointsAfter) ||
          effects.pointsBefore! < 0 || effects.pointsAfter !== effects.pointsBefore! + effects.pointsGained ||
          effects.available_points !== effects.pointsAfter) return;

      // The BE event has no event ID. Suppress immediate duplicate delivery,
      // while allowing a later legitimate reward for the same pillar.
      const now = Date.now();
      const key = `${data.perkId}:${effects.maxedSkillName}:${effects.pointsBefore}:${effects.pointsAfter}`;
      if (recent.current.has(key) && now - recent.current.get(key)! < 5_000) return;
      for (const [seenKey, at] of recent.current) {
        if (now - at >= 5_000) recent.current.delete(seenKey);
      }
      recent.current.set(key, now);
      setRewards(previous => [...previous, {
        perkId: data.perkId!,
        pillar: effects.maxedSkillName!,
        pointsGained: effects.pointsGained!,
        poolAfterReward: effects.pointsAfter!,
      }]);
      // Skill PATCH returns a pool snapshot from before the bonus. Refetch
      // committed server state instead of adding a second point locally.
      void queryClient.invalidateQueries({ queryKey: ["skills", studentId, courseId] });
      void queryClient.invalidateQueries({ queryKey: ["assigned-ceo", courseId, studentId] });
    };
    socket.on("perk-activated", activated);
    return () => { socket.off("perk-activated", activated); };
  }, [socket, courseId, studentId, perks, queryClient]);

  const closeMasterpieceReward = useCallback(() => {
    setRewards(previous => previous.slice(1));
  }, []);

  return { masterpieceReward: rewards[0] ?? null, closeMasterpieceReward };
}
