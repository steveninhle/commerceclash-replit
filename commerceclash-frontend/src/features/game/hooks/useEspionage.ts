import { useCallback, useEffect, useState } from "react";
import { get, END_POINTS } from "@/api";
import { useSocket } from "@/context";

export interface RivalSkillTree {
  studentId: string;
  name: string;
  skills: { attributeName: string; value: number }[];
}

const normalizeTitle = (title: string) =>
  title.toLowerCase().replace(/[\s_]+/g, "_");

const isExplorerTitle = (title: string) =>
  normalizeTitle(title) === "the_explorer";

interface UseEspionageOptions {
  courseId: string | null;
  userId: string | undefined;
  role: string | undefined;
}

interface UseEspionageReturn {
  isExplorer: boolean;
  isActive: boolean;         // espionage approved + skill trees loaded
  isSkillsLocked: boolean;
  rivalSkillTrees: RivalSkillTree[];
  refresh: () => void;
}

export function useEspionage({
  courseId,
  userId,
  role,
}: UseEspionageOptions): UseEspionageReturn {
  const socket = useSocket();
  const [isExplorer, setIsExplorer] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSkillsLocked, setIsSkillsLocked] = useState(false);
  const [rivalSkillTrees, setRivalSkillTrees] = useState<RivalSkillTree[]>([]);

  const storageKey = courseId && userId ? `espionage_${courseId}_${userId}` : null;

  const activate = useCallback((trees: RivalSkillTree[]) => {
    setRivalSkillTrees(trees);
    setIsActive(true);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(trees));
    }
  }, [storageKey]);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setRivalSkillTrees([]);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [storageKey]);

  const check = useCallback(async () => {
    if (!courseId || !userId || role !== "student") return;

    try {
      const res = await get(
        END_POINTS.GET_ASSIGNED_CEO
          .replace("{cid}", courseId)
          .replace("{sid}", userId),
      );

      const title: string = res?.data?.title ?? "";
      const explorer = isExplorerTitle(title);
      setIsExplorer(explorer);

      if (!explorer) { deactivate(); return; }

      const perks: { key: string; perk_status: string | null; is_used?: boolean }[] =
        res?.data?.perks ?? [];
      const espionagePerk = perks.find((p) => p.key === "corporate_espionage");
      const perkApproved =
        espionagePerk?.perk_status === "approved" ||
        espionagePerk?.is_used === true;

      if (!perkApproved) { deactivate(); return; }

      // Try localStorage first, then backend
      const stored = storageKey ? localStorage.getItem(storageKey) : null;
      if (stored) {
        try { activate(JSON.parse(stored)); return; } catch { /* fall through */ }
      }

      const espionageRes = await get(
        END_POINTS.GET_ESPIONAGE_DATA
          .replace("{cid}", courseId)
          .replace("{sid}", userId),
      );
      const trees: RivalSkillTree[] = espionageRes?.data?.skillTrees ?? [];
      if (trees.length > 0) activate(trees);
      else deactivate();
    } catch {
      setIsExplorer(false);
      deactivate();
    }
  }, [courseId, userId, role, storageKey, activate, deactivate]);

  // Initial load + re-check on CEO reassign
  useEffect(() => { check(); }, [check]);

  // Window events: skills lock/unlock, espionage activated/denied from HeroCard
  useEffect(() => {
    const onLocked = () => setIsSkillsLocked(true);
    const onUnlocked = () => setIsSkillsLocked(false);
    const onEspionageActivated = (e: Event) => {
      const trees = (e as CustomEvent<{ skillTrees?: RivalSkillTree[] }>).detail?.skillTrees;
      if (trees && trees.length > 0) {
        setIsExplorer(true);
        activate(trees);
      }
    };
    const onEspionageDenied = () => deactivate();

    window.addEventListener("skills-locked", onLocked);
    window.addEventListener("skills-unlocked", onUnlocked);
    window.addEventListener("espionage-activated", onEspionageActivated);
    window.addEventListener("espionage-denied", onEspionageDenied);
    return () => {
      window.removeEventListener("skills-locked", onLocked);
      window.removeEventListener("skills-unlocked", onUnlocked);
      window.removeEventListener("espionage-activated", onEspionageActivated);
      window.removeEventListener("espionage-denied", onEspionageDenied);
    };
  }, [activate, deactivate]);

  // Socket events
  useEffect(() => {
    const onPerkActivated = (data: {
      success: boolean;
      data?: { effects?: { skillTrees?: RivalSkillTree[] } };
    }) => {
      const trees = data.data?.effects?.skillTrees;
      if (!trees || trees.length === 0) return;
      setIsExplorer(true);
      activate(trees);
    };

    const onPerkStatusChanged = (data: {
      data?: { perk_status?: string; perkKey?: string };
    }) => {
      const { perk_status, perkKey } = data.data ?? {};
      if (
        perkKey === "corporate_espionage" &&
        (perk_status === "denied" || perk_status === "reset")
      ) {
        deactivate();
      }
    };

    const onAssignedCeo = (response: {
      success: boolean;
      data?: { result?: { archetype?: { title?: string } } };
    }) => {
      if (!response.success) return;
      const title = response.data?.result?.archetype?.title ?? "";
      if (!isExplorerTitle(title)) {
        setIsExplorer(false);
        deactivate();
      } else {
        setIsExplorer(true);
        check();
      }
    };

    socket.on("perk-activated", onPerkActivated);
    socket.on("perk-status-changed", onPerkStatusChanged);
    socket.on("assigned-ceo", onAssignedCeo);
    return () => {
      socket.off("perk-activated", onPerkActivated);
      socket.off("perk-status-changed", onPerkStatusChanged);
      socket.off("assigned-ceo", onAssignedCeo);
    };
  }, [socket, activate, deactivate, check]);

  return { isExplorer, isActive, isSkillsLocked, rivalSkillTrees, refresh: check };
}
