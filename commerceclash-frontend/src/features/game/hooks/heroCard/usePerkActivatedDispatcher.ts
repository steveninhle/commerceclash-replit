import { useEffect } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { ScenarioCard } from "../../components/ScenarioSelectionModal";
import type { RivalSkill as SabotageSkill } from "../../components/SabotageRedistributeModal";
import type {
  DangerZonePhaseData,
  Perk,
  RivalSkillTree,
  SabotageRival,
  TrendsetterRival,
} from "./types";

export interface TargetRivalModalData {
  title: string;
  description: string;
  rivals: {
    id: string;
    name: string;
    marketShare?: number;
    skillPoints?: number;
    ceo?: { title: string };
  }[];
  perkId: string;
  actionText?: string;
  perkKey?: "star_power" | "extortion";
  themeColor?: "amber" | "purple" | "red" | "emerald";
}

interface UsePerkActivatedDispatcherOptions {
  socket: Socket;
  onRefresh?: () => void;
  courseId: string | null;
  studentId: string;
  perks: Perk[];
  clearStatus: (perkId: string) => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;

  // Corporate Espionage reveal
  setSkillTreesModalOpen: (open: boolean) => void;
  setRivalSkillTrees: (trees: RivalSkillTree[]) => void;

  // Trailblazer
  trailblazerPerkId: string | null;
  sabotagePerkId: string | null;
  trendsetterPerkId: string | null;
  dangerZonePerkId?: string | null;
  targetRivalModalData?: TargetRivalModalData | null;
  scenarioModalOpen: boolean;
  setScenarioModalOpen: (open: boolean) => void;
  setScenarioCards: (cards: ScenarioCard[]) => void;
  setTrailblazerPerkId: (id: string | null) => void;
  setIsSelectingScenario: (selecting: boolean) => void;

  // Sabotage
  sabotageModalOpen: boolean;
  sabotageRedistributeModalOpen: boolean;
  setSabotageModalOpen: (open: boolean) => void;
  setSabotageRedistributeModalOpen: (open: boolean) => void;
  setSabotageRivals: (rivals: SabotageRival[]) => void;
  setSabotagePerkId: (id: string | null) => void;
  setSabotageTargetId: (id: string | null) => void;
  setSabotageTargetName: (name: string) => void;
  setSabotageSkillTree: (tree: SabotageSkill[]) => void;
  setIsSelectingTarget: (selecting: boolean) => void;
  setIsRedistributing: (redistributing: boolean) => void;

  // Trendsetter
  trendsetterModalOpen: boolean;
  setTrendsetterModalOpen: (open: boolean) => void;
  setTrendsetterRivals: (rivals: TrendsetterRival[]) => void;
  setTrendsetterPerkId: (id: string | null) => void;
  setTrendsetterGained: (gained: number) => void;
  setTrendsetterNewMS: (ms: number | undefined) => void;
  setIsSelectingTrendsetterTarget: (selecting: boolean) => void;

  // Danger Zone
  dangerZoneModalOpen?: boolean;
  setDangerZoneModalOpen?: (open: boolean) => void;
  setDangerZonePhaseData?: (data: DangerZonePhaseData | null) => void;
  setDangerZonePerkId?: (id: string | null) => void;

  // Target Rival Perk Modal (Star Power / Extortion)
  targetRivalModalOpen?: boolean;
  setTargetRivalModalOpen?: (open: boolean) => void;
  setTargetRivalModalData?: (data: TargetRivalModalData | null) => void;
}

// Route real socket events by an owned API perk ID/key, then validate the
// phase payload required by that picker. Completed effects cannot reopen it.
export const usePerkActivatedDispatcher = ({
  socket,
  onRefresh,
  courseId,
  studentId,
  perks,
  clearStatus,
  onPerkUpdate,
  setSkillTreesModalOpen,
  setRivalSkillTrees,
  trailblazerPerkId,
  sabotagePerkId,
  trendsetterPerkId,
  dangerZonePerkId,
  targetRivalModalData,
  scenarioModalOpen,
  setScenarioModalOpen,
  setScenarioCards,
  setTrailblazerPerkId,
  setIsSelectingScenario,
  sabotageModalOpen,
  sabotageRedistributeModalOpen,
  setSabotageModalOpen,
  setSabotageRedistributeModalOpen,
  setSabotageRivals,
  setSabotagePerkId,
  setSabotageTargetId,
  setSabotageTargetName,
  setSabotageSkillTree,
  setIsSelectingTarget,
  setIsRedistributing,
  trendsetterModalOpen,
  setTrendsetterModalOpen,
  setTrendsetterRivals,
  setTrendsetterPerkId,
  setTrendsetterGained,
  setTrendsetterNewMS,
  setIsSelectingTrendsetterTarget,
  dangerZoneModalOpen,
  setDangerZoneModalOpen,
  setDangerZonePhaseData,
  setDangerZonePerkId,
  targetRivalModalOpen,
  setTargetRivalModalOpen,
  setTargetRivalModalData,
}: UsePerkActivatedDispatcherOptions) => {
  useEffect(() => {
    const handlePerkActivated = (response: {
      success: boolean;
      message?: string;
      data?: {
        studentId?: string;
        perkId?: string;
        perkTitle?: string;
        perk_status?: string;
        effects?: {
          phase?: number;
          requiresSelection?: boolean;
          requiresRedistribution?: boolean;
          pendingCompletion?: boolean;
          waitingForTrigger?: boolean;
          rivals?: (SabotageRival & { skillPoints?: number })[];
          skillTrees?: RivalSkillTree[];
          scenarioCards?: ScenarioCard[];
          targetId?: string;
          targetName?: string;
          skillTree?: SabotageSkill[];
          maxPointsToMove?: number;
          diplomatGained?: number;
          newDiplomatMS?: number;
          pointsToRemove?: number;
          msToSteal?: number;
          effectType?: string;
          skillPointsToSteal?: number;
          scenarioType?: string;
          affectedStudentIds?: string[];
        };
      };
    }) => {
      const data = response.data;
      const effects = data?.effects;
      // Completion events are sent privately; broadcasts carry an owner ID.
      if (data?.studentId && data.studentId !== studentId) {
        if (
          response.success &&
          effects?.affectedStudentIds?.includes(studentId)
        )
          onRefresh?.();
        return;
      }
      if (!response.success || !data?.perkId) {
        if (!response.success)
          toast.error(response.message || "Unable to activate this perk.");
        onRefresh?.();
        return;
      }

      // Private completion messages omit studentId. Resolve their ID against
      // the current student's API data instead of trusting a title or shape.
      const ownedPerk = perks.find((perk) => perk.id === data.perkId);
      if (!ownedPerk) {
        onRefresh?.();
        return;
      }
      const perkKey = ownedPerk.key;
      const isSabotage = [
        "sabotage",
        "diplomat_sabotage",
        "core_sabotage",
      ].includes(perkKey ?? "");

      clearStatus(data.perkId);
      onPerkUpdate?.(
        { id: data.perkId },
        {
          status: data.perk_status ?? null,
          used: data.perk_status === "used",
          approved: data.perk_status === "approved",
        },
      );
      onRefresh?.();

      if (effects?.waitingForTrigger) {
        toast.info(
          response.message || "Approved; waiting for the gameplay trigger.",
        );
        return;
      }
      if (perkKey === "corporate_espionage" && effects?.skillTrees) {
        setRivalSkillTrees(effects.skillTrees);
        if (courseId) {
          localStorage.setItem(
            `espionage_${courseId}_${studentId}`,
            JSON.stringify(effects.skillTrees),
          );
          window.dispatchEvent(
            new CustomEvent("espionage-activated", {
              detail: { courseId, skillTrees: effects.skillTrees },
            }),
          );
        }
        setSkillTreesModalOpen(true);
      } else if (
        perkKey === "trailblazer" &&
        data.perk_status !== "used" &&
        effects?.requiresSelection &&
        effects.scenarioCards?.length
      ) {
        setScenarioCards(effects.scenarioCards);
        setTrailblazerPerkId(data.perkId);
        setIsSelectingScenario(false);
        setScenarioModalOpen(true);
      } else if (
        isSabotage &&
        data.perk_status !== "used" &&
        effects?.requiresRedistribution &&
        effects.skillTree
      ) {
        setSabotageModalOpen(false);
        setSabotageTargetId(effects.targetId ?? null);
        setSabotageTargetName(effects.targetName ?? "Unknown");
        setSabotageSkillTree(effects.skillTree);
        setSabotageRedistributeModalOpen(true);
        setIsSelectingTarget(false);
        setIsRedistributing(false);
      } else if (
        perkKey === "trendsetter" &&
        data.perk_status !== "used" &&
        effects?.requiresSelection &&
        effects.diplomatGained !== undefined &&
        effects.rivals
      ) {
        setTrendsetterRivals(
          effects.rivals.map((rival) => ({
            ...rival,
            marketShare: rival.marketShare ?? 0,
          })),
        );
        setTrendsetterPerkId(data.perkId);
        setTrendsetterGained(effects.diplomatGained);
        setTrendsetterNewMS(effects.newDiplomatMS);
        setIsSelectingTrendsetterTarget(false);
        setTrendsetterModalOpen(true);
      } else if (
        perkKey === "danger_zone" &&
        data.perk_status !== "used" &&
        effects?.requiresSelection &&
        effects.skillTree &&
        effects.rivals &&
        effects.pointsToRemove !== undefined &&
        effects.msToSteal !== undefined
      ) {
        setDangerZonePhaseData?.({
          ...effects,
          skillTree: effects.skillTree,
          rivals: effects.rivals.map((rival) => ({
            ...rival,
            marketShare: rival.marketShare ?? 0,
          })),
          pointsToRemove: effects.pointsToRemove,
          msToSteal: effects.msToSteal,
        });
        setDangerZonePerkId?.(data.perkId);
        setDangerZoneModalOpen?.(true);
      } else if (
        (perkKey === "star_power" || perkKey === "extortion") &&
        data.perk_status !== "used" &&
        effects?.requiresSelection &&
        effects.rivals &&
        (perkKey === "star_power"
          ? effects.msToSteal !== undefined
          : effects.skillPointsToSteal !== undefined)
      ) {
        const isSkillTransfer = perkKey === "extortion";
        const amount = isSkillTransfer
          ? effects.skillPointsToSteal
          : effects.msToSteal;
        setTargetRivalModalData?.({
          title: ownedPerk.title,
          description: response.message ?? "Choose an eligible rival.",
          rivals: effects.rivals,
          perkId: data.perkId,
          actionText: `Steal ${amount} ${isSkillTransfer ? "Pts" : "MS"}`,
          perkKey,
          themeColor: isSkillTransfer ? "purple" : "amber",
        });
        setTargetRivalModalOpen?.(true);
      } else if (
        isSabotage &&
        data.perk_status !== "used" &&
        effects?.requiresSelection &&
        effects.rivals
      ) {
        setSabotageRivals(effects.rivals);
        setSabotagePerkId(data.perkId);
        setIsSelectingTarget(false);
        setSabotageModalOpen(true);
      } else if (data.perk_status === "used") {
        // A completed effect never re-enters a selection branch.
        if (scenarioModalOpen && trailblazerPerkId === data.perkId) {
          setScenarioModalOpen(false);
          setScenarioCards([]);
          setTrailblazerPerkId(null);
          setIsSelectingScenario(false);
        }
        if (trendsetterModalOpen && trendsetterPerkId === data.perkId) {
          setTrendsetterModalOpen(false);
          setTrendsetterRivals([]);
          setTrendsetterPerkId(null);
          setIsSelectingTrendsetterTarget(false);
        }
        if (
          (sabotageModalOpen || sabotageRedistributeModalOpen) &&
          sabotagePerkId === data.perkId
        ) {
          setSabotageModalOpen(false);
          setSabotageRedistributeModalOpen(false);
          setSabotageRivals([]);
          setSabotagePerkId(null);
          setSabotageTargetId(null);
          setSabotageTargetName("");
          setSabotageSkillTree([]);
          setIsSelectingTarget(false);
          setIsRedistributing(false);
        }
        if (dangerZonePerkId === data.perkId) {
          setDangerZoneModalOpen?.(false);
          setDangerZonePhaseData?.(null);
          setDangerZonePerkId?.(null);
        }
        if (targetRivalModalData?.perkId === data.perkId) {
          setTargetRivalModalOpen?.(false);
          setTargetRivalModalData?.(null);
        }
      }
      // Masterpiece has its own confirmed reward presentation.
      if (perkKey === "masterpiece") return;
      if (response.message) {
        if (effects?.pendingCompletion) toast.info(response.message);
        else if (effects?.scenarioType) toast.info(response.message);
        else toast.success(response.message);
      }
    };
    socket.on("perk-activated", handlePerkActivated);
    return () => {
      socket.off("perk-activated", handlePerkActivated);
    };
  }, [
    socket,
    onRefresh,
    courseId,
    studentId,
    perks,
    clearStatus,
    onPerkUpdate,
    trailblazerPerkId,
    sabotagePerkId,
    trendsetterPerkId,
    dangerZonePerkId,
    targetRivalModalData,
    scenarioModalOpen,
    sabotageModalOpen,
    sabotageRedistributeModalOpen,
    trendsetterModalOpen,
    dangerZoneModalOpen,
    targetRivalModalOpen,
    setSkillTreesModalOpen,
    setRivalSkillTrees,
    setScenarioModalOpen,
    setScenarioCards,
    setTrailblazerPerkId,
    setIsSelectingScenario,
    setSabotageModalOpen,
    setSabotageRedistributeModalOpen,
    setSabotageRivals,
    setSabotagePerkId,
    setSabotageTargetId,
    setSabotageTargetName,
    setSabotageSkillTree,
    setIsSelectingTarget,
    setIsRedistributing,
    setTrendsetterModalOpen,
    setTrendsetterRivals,
    setTrendsetterPerkId,
    setTrendsetterGained,
    setTrendsetterNewMS,
    setIsSelectingTrendsetterTarget,
    setDangerZoneModalOpen,
    setDangerZonePhaseData,
    setDangerZonePerkId,
    setTargetRivalModalOpen,
    setTargetRivalModalData,
  ]);
};
