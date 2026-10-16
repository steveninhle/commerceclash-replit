import { useMasterpieceFlow } from "../../hooks/heroCard/useMasterpieceFlow";
import { useTargetRivalFlow } from "../../hooks/heroCard/useTargetRivalFlow";
import { useEffect } from "react";
import { isPerkAvailableAtLevel } from "../../utils/perkState";
import { useLocation } from "react-router-dom";
import { useUserContext, useSocket } from "@/context";
import { cn } from "@/lib/utils";
import { normalizeCharacterTitle, studentCeoAssets } from "@/utils/helper";
import { HeroCard } from "../HeroCard";
import { HeroCardModals } from "../heroCard/HeroCardModals";
import { useReveredIconFlow } from "../../hooks/heroCard/useReveredIconFlow";
import { usePerkSocketConnection } from "../../hooks/heroCard/usePerkSocketConnection";
import { usePerkOptimisticStatus } from "../../hooks/heroCard/usePerkOptimisticStatus";
import { useSabotageFlow } from "../../hooks/heroCard/useSabotageFlow";
import { useCorporateEspionageReveal } from "../../hooks/heroCard/useCorporateEspionageReveal";
import { useTrailblazerFlow } from "../../hooks/heroCard/useTrailblazerFlow";
import { useTrendsetterFlow } from "../../hooks/heroCard/useTrendsetterFlow";
import { usePerkLifecycleEvents } from "../../hooks/heroCard/usePerkLifecycleEvents";
import {
  usePerkActivatedDispatcher,
} from "../../hooks/heroCard/usePerkActivatedDispatcher";
import { useFanTheFlamesFlow } from "../../hooks/heroCard/useFanTheFlamesFlow";
import { useDangerZoneFlow } from "../../hooks/heroCard/useDangerZoneFlow";
import { useScenarioPredictionFlow } from "../../hooks/heroCard/useScenarioPredictionFlow";
import type { Character } from "../../hooks/heroCard/types";
import { BORDER, GLOW, RADIUS, SPACING, SURFACE } from "./constants";
import { heroThemeStyle } from "./theme";
import { HeroSelectCardHeroLive } from "./HeroSelectCardHeroLive";
import { HeroSelectCardProgress } from "./HeroSelectCardProgress";
import { HeroSelectCardLevelBadge } from "./HeroSelectCardLevelBadge";
import { HeroSelectCardPerksListLive } from "./HeroSelectCardPerksListLive";
import { HERO_GALLERY_DATA } from "./heroesData";
import type { HeroSelectCardData } from "./types";

const XP_PER_LEVEL = 10;
const MAX_LEVEL = 5;

type HeroSelectCardLiveProps = {
  character: Character;
  imageSrc: string;
  imageAlt: string;
  logoSrc: string;
  xpProgress?: number;
  levelProgress?: number;
  courseId?: string | null;
  onRefresh?: () => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Character["perks"][number]>,
  ) => void;
};

function HeroSelectCardLive(props: HeroSelectCardLiveProps) {
  const targetTitle = normalizeCharacterTitle(props.character.title);
  const curated = HERO_GALLERY_DATA.find(
    (h) => normalizeCharacterTitle(h.name) === targetTitle,
  );
  if (!curated) return <HeroCard {...props} />;
  return <HeroSelectCardLiveInner {...props} curated={curated} />;
}

function HeroSelectCardLiveInner({
  character,
  xpProgress,
  levelProgress,
  courseId: courseIdProp,
  onRefresh,
  onPerkUpdate,
  curated,
}: HeroSelectCardLiveProps & { curated: HeroSelectCardData }) {
  const socket = useSocket();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");
  const courseId =
    courseIdProp ||
    location.state?.courseId ||
    searchParams.get("courseId") ||
    searchParams.get("classId") ||
    (meetingId ? localStorage.getItem(`meeting_${meetingId}_courseId`) : null) ||
    localStorage.getItem("currentCourseId") ||
    localStorage.getItem("activeCourseId") ||
    null;
  const { id: student_id } = useUserContext();

  const { masterpieceReward, closeMasterpieceReward } = useMasterpieceFlow({
    socket, courseId, studentId: student_id, perks: character.perks,
  });

  const { isConnected, setPendingRequests } = usePerkSocketConnection({
    socket,
    courseId,
    studentId: student_id,
  });

  const {
    reveredIconModalOpen,
    reveredIconPending,
    isCancellingPerk,
    handleReveredIconCancel,
    handleCloseReveredIconModal,
  } = useReveredIconFlow({
    socket,
    onRefresh,
    characterTitle: character.title,
    courseId,
    studentId: student_id,
  });

  const { getEffectiveStatus, clearStatus, approvePerk } =
    usePerkOptimisticStatus({
      character,
      socket,
      courseId,
      studentId: student_id,
      isConnected,
      studentLevel: levelProgress,
      queuePendingRequest: (request) =>
        setPendingRequests((prev) => [...prev, request]),
      onPerkUpdate,
      onRefresh,
    });

  const {
    sabotageModalOpen,
    setSabotageModalOpen,
    sabotageRivals,
    setSabotageRivals,
    sabotagePerkId,
    setSabotagePerkId,
    isSelectingTarget,
    setIsSelectingTarget,
    sabotageRedistributeModalOpen,
    setSabotageRedistributeModalOpen,
    sabotageTargetId,
    setSabotageTargetId,
    sabotageTargetName,
    setSabotageTargetName,
    sabotageSkillTree,
    setSabotageSkillTree,
    isRedistributing,
    setIsRedistributing,
    handleSabotageTargetSelect,
    handleSabotageRedistribute,
    handleCloseSabotageModal,
    handleCloseSabotageRedistributeModal,
  } = useSabotageFlow({
    socket,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
  });

  const {
    skillTreesModalOpen,
    setSkillTreesModalOpen,
    rivalSkillTrees,
    setRivalSkillTrees,
    handleCloseSkillTreesModal,
  } = useCorporateEspionageReveal();

  const {
    scenarioModalOpen,
    setScenarioModalOpen,
    scenarioCards,
    setScenarioCards,
    trailblazerPerkId,
    setTrailblazerPerkId,
    isSelectingScenario,
    setIsSelectingScenario,
    handleScenarioSelect,
    handleCloseScenarioModal,
  } = useTrailblazerFlow({
    socket,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
  });

  const {
    trendsetterModalOpen,
    setTrendsetterModalOpen,
    trendsetterRivals,
    setTrendsetterRivals,
    trendsetterPerkId,
    setTrendsetterPerkId,
    trendsetterGained,
    setTrendsetterGained,
    trendsetterNewMS,
    setTrendsetterNewMS,
    isSelectingTrendsetterTarget,
    setIsSelectingTrendsetterTarget,
    handleTrendsetterTargetSelect,
    handleCloseTrendsetterModal,
  } = useTrendsetterFlow({
    socket,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
  });

  const {
    fanTheFlamesModalOpen,
    fanTheFlamesOffer,
    isRedirecting: isRedirectingFanTheFlames,
    handleFanTheFlamesRedirect,
    handleCloseFanTheFlamesModal,
  } = useFanTheFlamesFlow({
    socket,
    perkId: character.perks.find((perk) => perk.key === "fan_the_flames")?.id,
    courseId,
    studentId: student_id,
    onRefresh,
  });

  const {
    dangerZoneModalOpen,
    setDangerZoneModalOpen,
    dangerZonePhaseData,
    setDangerZonePhaseData,
    dangerZonePerkId,
    setDangerZonePerkId,
    isSubmittingDangerZone,
    handleSubmitDangerZone,
    handleCloseDangerZoneModal,
  } = useDangerZoneFlow({
    socket,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
    onRefresh,
  });

  const {
    predictionModalOpen,
    setPredictionModalOpen,
    isSubmittingPrediction,
    handleScenarioPrediction,
  } = useScenarioPredictionFlow({
    socket,
    courseId,
    studentId: student_id,
    onRefresh,
  });

  const {
    targetRivalModalOpen, setTargetRivalModalOpen, targetRivalModalData,
    setTargetRivalModalData, isSelectingTargetRival, handleSelectTargetRival,
    handleCloseTargetRivalModal,
  } = useTargetRivalFlow({ socket, courseId, studentId: student_id, onRefresh });

  useEffect(() => {
    if (courseId && student_id) {
      const joinRoom = () => {
        socket.emit("join-room", { classId: [courseId], studentId: student_id });
      };
      if (socket.connected) {
        joinRoom();
      }
      socket.on("connect", joinRoom);
      return () => {
        socket.off("connect", joinRoom);
      };
    }
  }, [socket, courseId, student_id]);

  usePerkActivatedDispatcher({
    socket,
    perks: character.perks,
    onRefresh,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
    setSkillTreesModalOpen,
    setRivalSkillTrees,
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
    trailblazerPerkId, sabotagePerkId, trendsetterPerkId, dangerZonePerkId, targetRivalModalData,
  });

  usePerkLifecycleEvents({
    socket,
    onRefresh,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
  });

  const level = levelProgress ?? 1;
  const currentXP =
    level >= MAX_LEVEL ? XP_PER_LEVEL : (xpProgress ?? 0) % XP_PER_LEVEL;

  return (
    <div
      style={heroThemeStyle(curated.theme)}
      className="relative flex h-full w-full flex-col overflow-hidden bg-black [container-type:inline-size]"
    >
      <div className="relative z-20 flex min-h-0 flex-1 flex-col">
        <HeroSelectCardHeroLive hero={curated} />
      </div>

      <div className="relative mx-2 @[770px]:mx-3">
        <div
          className={cn(
            "relative z-30 pt-2 pb-[40px] flex min-h-0 flex-col overflow-y-auto",
            // SPACING.lg,
            SPACING.sectionX,
            RADIUS.panel,
            BORDER.panel,
            SURFACE.panel,
            GLOW.panel,
          )}
        >
          <div
            className={cn(
              "flex w-full flex-row items-center @[770px]:gap-6",
              SPACING.md,
            )}
          >
            <HeroSelectCardProgress
              currentXP={currentXP}
              nextLevelXP={XP_PER_LEVEL}
              levelProgress={level}
              accentColor={
                studentCeoAssets(character.title)?.color ?? curated.theme.primary
              }
              characterTitle={character.title}
            />
            <HeroSelectCardLevelBadge
              level={level}
              badgeAsset={curated.levelBadgeAsset}
              numberAsset={curated.levelNumberAsset}
              themeId={curated.theme.id}
              className="-translate-y-3"
            />
          </div>
          <HeroSelectCardPerksListLive
          perks={character.perks.map((perk) => ({
            ...perk,
            is_unlocked: isPerkAvailableAtLevel(perk, levelProgress),
          }))}
            visuals={curated.perks}
            dividerAsset={curated.lineDividerAsset}
            themeId={curated.theme.id}
            getEffectiveStatus={getEffectiveStatus}
            onActivate={approvePerk}
          />
        </div>
      </div>

      <HeroCardModals
        masterpieceReward={masterpieceReward}
        handleCloseMasterpieceReward={closeMasterpieceReward}
        sabotageModalOpen={sabotageModalOpen}
        sabotageRivals={sabotageRivals}
        isSelectingTarget={isSelectingTarget}
        handleSabotageTargetSelect={handleSabotageTargetSelect}
        handleCloseSabotageModal={handleCloseSabotageModal}
        sabotageRedistributeModalOpen={sabotageRedistributeModalOpen}
        sabotageTargetId={sabotageTargetId}
        sabotageTargetName={sabotageTargetName}
        sabotageSkillTree={sabotageSkillTree}
        isRedistributing={isRedistributing}
        handleSabotageRedistribute={handleSabotageRedistribute}
        handleCloseSabotageRedistributeModal={
          handleCloseSabotageRedistributeModal
        }
        skillTreesModalOpen={skillTreesModalOpen}
        rivalSkillTrees={rivalSkillTrees}
        handleCloseSkillTreesModal={handleCloseSkillTreesModal}
        scenarioModalOpen={scenarioModalOpen}
        scenarioCards={scenarioCards}
        isSelectingScenario={isSelectingScenario}
        handleScenarioSelect={handleScenarioSelect}
        handleCloseScenarioModal={handleCloseScenarioModal}
        trendsetterModalOpen={trendsetterModalOpen}
        trendsetterRivals={trendsetterRivals}
        isSelectingTrendsetterTarget={isSelectingTrendsetterTarget}
        trendsetterGained={trendsetterGained}
        trendsetterNewMS={trendsetterNewMS}
        handleTrendsetterTargetSelect={handleTrendsetterTargetSelect}
        handleCloseTrendsetterModal={handleCloseTrendsetterModal}
        reveredIconModalOpen={reveredIconModalOpen}
        reveredIconPending={reveredIconPending}
        isCancellingPerk={isCancellingPerk}
        handleReveredIconCancel={handleReveredIconCancel}
        handleCloseReveredIconModal={handleCloseReveredIconModal}
        fanTheFlamesModalOpen={fanTheFlamesModalOpen}
        fanTheFlamesOffer={fanTheFlamesOffer}
        handleFanTheFlamesRedirect={handleFanTheFlamesRedirect}
        handleCloseFanTheFlamesModal={handleCloseFanTheFlamesModal}
        isRedirectingFanTheFlames={isRedirectingFanTheFlames}
        dangerZoneModalOpen={dangerZoneModalOpen}
        dangerZonePhaseData={dangerZonePhaseData}
        handleSubmitDangerZone={handleSubmitDangerZone}
        handleCloseDangerZoneModal={handleCloseDangerZoneModal}
        isSubmittingDangerZone={isSubmittingDangerZone}
        handleResumeTargetRivalModal={() => setTargetRivalModalOpen(true)}
        targetRivalModalOpen={targetRivalModalOpen}
        targetRivalModalData={targetRivalModalData}
        handleSelectTargetRival={handleSelectTargetRival}
        handleCloseTargetRivalModal={handleCloseTargetRivalModal}
        isSelectingTargetRival={isSelectingTargetRival}
        predictionModalOpen={predictionModalOpen}
        handleScenarioPrediction={handleScenarioPrediction}
        handleClosePredictionModal={() => setPredictionModalOpen(false)}
        isSubmittingPrediction={isSubmittingPrediction}
      />
    </div>
  );
}

export { HeroSelectCardLive };
