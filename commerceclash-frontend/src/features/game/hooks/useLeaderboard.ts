import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { get, END_POINTS } from "@/api";
import { useSocket } from "@/context/socketContext/socketContext";

export interface CEO {
  id: string;
  title: string;
}

export interface LeaderboardStudent {
  id: string;
  name: string;
  market_share: number;
  ceo: CEO;
}

interface LeaderboardSocketPayload {
  data?: { students?: LeaderboardStudent[] };
}

export function useLeaderboard(courseId: string | null) {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["leaderboard", courseId] as const,
    [courseId],
  );

  const { data, isPending } = useQuery<LeaderboardStudent[]>({
    queryKey,
    enabled: !!courseId,
    queryFn: async () => {
      const endpoint = END_POINTS.GET_LEADERBOARD.replace("{cid}", courseId!);
      const res = await get(endpoint);
      return res.data.students ?? [];
    },
  });

  // Socket: incremental updates with debounce
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleLeaderboardUpdated = (payload: LeaderboardSocketPayload) => {
      const updates = payload.data?.students;
      if (!updates) return;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        queryClient.setQueryData<LeaderboardStudent[]>(
          queryKey,
          (prev = []) => {
            const map = new Map(prev.map((s) => [s.id, s]));
            updates.forEach((s) => {
              map.set(s.id, {
                ...map.get(s.id),
                ...s,
                ...(s.ceo ? { ceo: s.ceo } : {}),
              });
            });
            return Array.from(map.values());
          },
        );
      }, 100);
    };

    const refresh = () => { void queryClient.invalidateQueries({ queryKey }); };
    const completed = (response: { success?: boolean; data?: { perk_status?: string } }) => {
      if (response.success && response.data?.perk_status === "used") refresh();
    };

    socket.on("leaderboard-updated", handleLeaderboardUpdated);
    socket.on("perk-activated", completed);
    socket.on("skill-updated", refresh);
    socket.on("connect", refresh);
    return () => {
      socket.off("leaderboard-updated", handleLeaderboardUpdated);
      socket.off("perk-activated", completed);
      socket.off("skill-updated", refresh);
      socket.off("connect", refresh);
      clearTimeout(timeout);
    };
  }, [socket, queryClient, queryKey]);

  const allStudents = useMemo(
    () =>
      (data ?? []).slice().sort((a, b) => {
        const shareDiff = b.market_share - a.market_share;
        if (shareDiff !== 0) return shareDiff;
        const aName = a.name ?? "";
        const bName = b.name ?? "";
        const aIsNum = /^\d/.test(aName);
        const bIsNum = /^\d/.test(bName);
        if (aIsNum !== bIsNum) return aIsNum ? 1 : -1;
        return a?.name?.localeCompare(b.name);
      }),
    [data],
  );
  const topStudents = useMemo(() => allStudents.slice(0, 6), [allStudents]);

  return { topStudents, allStudents, isLoading: isPending };
}
