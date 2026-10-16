import { useMasterpieceFlow } from "../hooks/heroCard/useMasterpieceFlow";
import { useTargetRivalFlow } from "../hooks/heroCard/useTargetRivalFlow";
import { useEffect } from "react";
import { isPerkAvailableAtLevel } from "../utils/perkState";
import { useLocation } from "react-router-dom";
import { useUserContext, useSocket } from "@/context";
import ProgressBar from "@/components/ui/ProgressBar";
import { HeroCardHeader } from "./heroCard/HeroCardHeader";
import { HeroCardPerksList } from "./heroCard/HeroCardPerksList";
import { HeroCardModals } from "./heroCard/HeroCardModals";
import { useReveredIconFlow } from "../hooks/heroCard/useReveredIconFlow";
import { usePerkSocketConnection } from "../hooks/heroCard/usePerkSocketConnection";
import { usePerkOptimisticStatus } from "../hooks/heroCard/usePerkOptimisticStatus";
import { useSabotageFlow } from "../hooks/heroCard/useSabotageFlow";
import { useCorporateEspionageReveal } from "../hooks/heroCard/useCorporateEspionageReveal";
import { useTrailblazerFlow } from "../hooks/heroCard/useTrailblazerFlow";
import { useTrendsetterFlow } from "../hooks/heroCard/useTrendsetterFlow";
import { usePerkLifecycleEvents } from "../hooks/heroCard/usePerkLifecycleEvents";
import { usePerkActivatedDispatcher } from "../hooks/heroCard/usePerkActivatedDispatcher";
import { useFanTheFlamesFlow } from "../hooks/heroCard/useFanTheFlamesFlow";
import { useDangerZoneFlow } from "../hooks/heroCard/useDangerZoneFlow";
import { useScenarioPredictionFlow } from "../hooks/heroCard/useScenarioPredictionFlow";
import type { Character } from "../hooks/heroCard/types";

export type { Character };

export function HeroCard({
  character,
  imageSrc,
  imageAlt,
  logoSrc,
  xpProgress,
  levelProgress,
  courseId: courseIdProp,
  onRefresh,
  onPerkUpdate,
}: {
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
}) {
  const socket = useSocket();
  const location = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const meetingId = searchParams.get("meetingId");
  const courseId =
    courseIdProp ||
    location.state?.courseId ||
    searchParams.get("courseId") ||
    searchParams.get("classId") ||
    (meetingId
      ? localStorage.getItem(`meeting_${meetingId}_courseId`)
      : null) ||
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
    targetRivalModalOpen,
    setTargetRivalModalOpen,
    targetRivalModalData,
    setTargetRivalModalData,
    isSelectingTargetRival,
    handleSelectTargetRival,
    handleCloseTargetRivalModal,
  } = useTargetRivalFlow({
    socket,
    courseId,
    studentId: student_id,
    onRefresh,
  });

  // Join the room so we can receive broadcast events
  useEffect(() => {
    if (courseId && student_id) {
      const joinRoom = () => {
        socket.emit("join-room", {
          classId: [courseId],
          studentId: student_id,
        });
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
    trailblazerPerkId,
    sabotagePerkId,
    trendsetterPerkId,
    dangerZonePerkId,
    targetRivalModalData,
  });

  usePerkLifecycleEvents({
    socket,
    onRefresh,
    courseId,
    studentId: student_id,
    clearStatus,
    onPerkUpdate,
  });

  return (
    <div className="relative bg-card text-card-foreground h-full flex flex-col overflow-hidden">
      <img
        src={imageSrc}
        alt={imageAlt}
        className="w-full h-full object-cover"
      />

      <div
        className="absolute max-[450px]:bottom-[61px] bottom-0 inset-x-0 max-[550px]:inset-x-2 max-[450px]:inset-x-1 sm:inset-x-6 z-10 flex flex-col -translate-y-16 max-[450px]:-translate-y-8 sm:-translate-y-[72px] md:-translate-y-[80px] lg:-translate-y-[24px]"
        style={{
          background: "linear-gradient(180deg, #0D1D1F 0%, #0C1F22 100%)",
          borderRadius: "28px",
          boxShadow: `
      0px -1px 0px 0px rgba(107, 255, 245, 0.25),
      0px 7px 18px 0px rgba(107, 255, 245, 0.33),
      0px 29px 35px 0px rgba(107, 255, 245, 0.25),
      0px 64px 50px 0px rgba(107, 255, 245, 0.18),
      0px 114px 60px 0px rgba(107, 255, 245, 0.12)
    `,
          maxHeight: "min(80vh, 700px)",
        }}
      >
        <HeroCardHeader
          title={character.title}
          subtitle={character.subtitle}
          logoSrc={logoSrc}
        />

        {/* Progress Bar */}
        <div className="px-2 min-[550px]:px-4 min-[450px]:px-3 sm:px-5 pb-3 max-[450px]:pb-1.5">
          <ProgressBar
            xpProgress={xpProgress ?? 0}
            levelProgress={levelProgress ?? 1}
            characterTitle={character.title}
          />
        </div>

        <HeroCardPerksList
          perks={character.perks.map((perk) => ({
            ...perk,
            is_unlocked: isPerkAvailableAtLevel(perk, levelProgress),
          }))}
          getEffectiveStatus={getEffectiveStatus}
          onActivate={approvePerk}
        />
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
