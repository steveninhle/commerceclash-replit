import { useCallback, useMemo, useState } from "react";
import type { Leader } from "../types";

interface UseLeaderSelectionResult {
  leaders: Leader[];
  selectedLeader: Leader;
  selectedIndex: number;
  selectLeader: (id: string) => void;
  selectNext: () => void;
  selectPrevious: () => void;
}

/** Owns which leader is currently highlighted/confirmed across the whole selection screen. */
export const useLeaderSelection = (
  leaders: Leader[],
  initialLeaderId?: string,
): UseLeaderSelectionResult => {
  const [selectedId, setSelectedId] = useState<string>(
    initialLeaderId ?? leaders[0]?.id ?? "",
  );

  const selectedIndex = useMemo(
    () => Math.max(0, leaders.findIndex((leader) => leader.id === selectedId)),
    [leaders, selectedId],
  );

  const selectedLeader = leaders[selectedIndex] ?? leaders[0];

  const selectLeader = useCallback((id: string) => setSelectedId(id), []);

  const selectNext = useCallback(() => {
    const next = leaders[(selectedIndex + 1) % leaders.length];
    if (next) setSelectedId(next.id);
  }, [leaders, selectedIndex]);

  const selectPrevious = useCallback(() => {
    const previous = leaders[(selectedIndex - 1 + leaders.length) % leaders.length];
    if (previous) setSelectedId(previous.id);
  }, [leaders, selectedIndex]);

  return { leaders, selectedLeader, selectedIndex, selectLeader, selectNext, selectPrevious };
};
