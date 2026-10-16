import { MasterpieceRewardModal } from "../MasterpieceRewardModal";
import type { MasterpieceReward } from "../../hooks/heroCard/useMasterpieceFlow";
import { Button } from "@/components/ui/button";
import { SabotageTargetModal } from "../SabotageTargetModal";
import {
  SabotageRedistributeModal,
  type RivalSkill as SabotageSkill,
} from "../SabotageRedistributeModal";
import { RivalSkillTreesModal } from "../RivalSkillTreesModal";
import {
  ScenarioSelectionModal,
  type ScenarioCard,
} from "../ScenarioSelectionModal";
import { TrendsetterModal } from "../TrendsetterModal";
import { ReveredIconModal } from "../ReveredIconModal";
import { FanTheFlamesModal } from "../FanTheFlamesModal";
import { DangerZoneModal } from "../DangerZoneModal";
import { TargetRivalPerkModal } from "../TargetRivalPerkModal";
import { ScenarioPredictionModal } from "../ScenarioPredictionModal";
import type {
  DangerZonePhaseData,
  FanTheFlamesOffer,
  ReveredIconPendingPerk,
  RivalSkillTree,
  SabotageRival,
  ScenarioType,
  SkillDeduction,
  TrendsetterRival,
} from "../../hooks/heroCard/types";
import type { TargetRivalModalData } from "../../hooks/heroCard/usePerkActivatedDispatcher";

interface HeroCardModalsProps {
  masterpieceReward?: MasterpieceReward | null;
  handleCloseMasterpieceReward?: () => void;
  sabotageModalOpen: boolean;
  sabotageRivals: SabotageRival[];
  isSelectingTarget: boolean;
  handleSabotageTargetSelect: (targetId: string) => void;
  handleCloseSabotageModal: () => void;

  sabotageRedistributeModalOpen: boolean;
  sabotageTargetId: string | null;
  sabotageTargetName: string;
  sabotageSkillTree: SabotageSkill[];
  isRedistributing: boolean;
  handleSabotageRedistribute: (redistribution: {
    decrements: { skillId: string; amount: number }[];
    increments: { skillId: string; amount: number }[];
  }) => void;
  handleCloseSabotageRedistributeModal: () => void;

  skillTreesModalOpen: boolean;
  rivalSkillTrees: RivalSkillTree[];
  handleCloseSkillTreesModal: () => void;

  scenarioModalOpen: boolean;
  scenarioCards: ScenarioCard[];
  isSelectingScenario: boolean;
  handleScenarioSelect: (scenario: ScenarioCard) => void;
  handleCloseScenarioModal: () => void;

  trendsetterModalOpen: boolean;
  trendsetterRivals: TrendsetterRival[];
  isSelectingTrendsetterTarget: boolean;
  trendsetterGained: number;
  trendsetterNewMS: number | undefined;
  handleTrendsetterTargetSelect: (targetId: string) => void;
  handleCloseTrendsetterModal: () => void;

  reveredIconModalOpen: boolean;
  reveredIconPending: ReveredIconPendingPerk | null;
  isCancellingPerk: boolean;
  handleReveredIconCancel: (pendingKey: string) => void;
  handleCloseReveredIconModal: () => void;

  // Fan the Flames
  fanTheFlamesModalOpen?: boolean;
  fanTheFlamesOffer?: FanTheFlamesOffer | null;
  handleFanTheFlamesRedirect?: (targetStudentId: string) => void;
  handleCloseFanTheFlamesModal?: () => void;
  isRedirectingFanTheFlames?: boolean;

  // Danger Zone
  dangerZoneModalOpen?: boolean;
  dangerZonePhaseData?: DangerZonePhaseData | null;
  handleSubmitDangerZone?: (targetStudentId: string, skillDeductions: SkillDeduction[]) => void;
  handleCloseDangerZoneModal?: () => void;
  isSubmittingDangerZone?: boolean;

  // Target Rival Perk Modal (Star Power / Extortion)
  handleResumeTargetRivalModal?: () => void;
  targetRivalModalOpen?: boolean;
  targetRivalModalData?: TargetRivalModalData | null;
  handleSelectTargetRival?: (targetStudentId: string) => void;
  handleCloseTargetRivalModal?: () => void;
  isSelectingTargetRival?: boolean;

  // Scenario Prediction (Prophecy)
  predictionModalOpen?: boolean;
  handleScenarioPrediction?: (predictedType: ScenarioType) => void;
  handleClosePredictionModal?: () => void;
  isSubmittingPrediction?: boolean;
}

export function HeroCardModals({
  masterpieceReward = null,
  handleCloseMasterpieceReward = () => {},
  sabotageModalOpen,
  sabotageRivals,
  isSelectingTarget,
  handleSabotageTargetSelect,
  handleCloseSabotageModal,
  sabotageRedistributeModalOpen,
  sabotageTargetId,
  sabotageTargetName,
  sabotageSkillTree,
  isRedistributing,
  handleSabotageRedistribute,
  handleCloseSabotageRedistributeModal,
  skillTreesModalOpen,
  rivalSkillTrees,
  handleCloseSkillTreesModal,
  scenarioModalOpen,
  scenarioCards,
  isSelectingScenario,
  handleScenarioSelect,
  handleCloseScenarioModal,
  trendsetterModalOpen,
  trendsetterRivals,
  isSelectingTrendsetterTarget,
  trendsetterGained,
  trendsetterNewMS,
  handleTrendsetterTargetSelect,
  handleCloseTrendsetterModal,
  reveredIconModalOpen,
  reveredIconPending,
  isCancellingPerk,
  handleReveredIconCancel,
  handleCloseReveredIconModal,

  // Fan the Flames
  fanTheFlamesModalOpen = false,
  fanTheFlamesOffer = null,
  handleFanTheFlamesRedirect = () => {},
  handleCloseFanTheFlamesModal = () => {},
  isRedirectingFanTheFlames = false,

  // Danger Zone
  dangerZoneModalOpen = false,
  dangerZonePhaseData = null,
  handleSubmitDangerZone = () => {},
  handleCloseDangerZoneModal = () => {},
  isSubmittingDangerZone = false,

  // Target Rival
  handleResumeTargetRivalModal,
  targetRivalModalOpen = false,
  targetRivalModalData = null,
  handleSelectTargetRival = () => {},
  handleCloseTargetRivalModal = () => {},
  isSelectingTargetRival = false,

  // Prediction
  predictionModalOpen = false,
  handleScenarioPrediction = () => {},
  handleClosePredictionModal = () => {},
  isSubmittingPrediction = false,
}: HeroCardModalsProps) {
  return (
    <>
      <MasterpieceRewardModal reward={masterpieceReward} onClose={handleCloseMasterpieceReward} />
      <SabotageTargetModal
        open={sabotageModalOpen}
        onClose={handleCloseSabotageModal}
        rivals={sabotageRivals}
        onSelectTarget={handleSabotageTargetSelect}
        isSelecting={isSelectingTarget}
      />

      <SabotageRedistributeModal
        open={sabotageRedistributeModalOpen}
        onClose={handleCloseSabotageRedistributeModal}
        targetId={sabotageTargetId || ""}
        targetName={sabotageTargetName}
        skillTree={sabotageSkillTree}
        maxPoints={3}
        onSubmit={handleSabotageRedistribute}
        isSubmitting={isRedistributing}
      />

      <RivalSkillTreesModal
        open={skillTreesModalOpen}
        onClose={handleCloseSkillTreesModal}
        skillTrees={rivalSkillTrees}
      />

      <ScenarioSelectionModal
        open={scenarioModalOpen}
        onClose={handleCloseScenarioModal}
        scenarios={scenarioCards}
        onSelectScenario={handleScenarioSelect}
        isSelecting={isSelectingScenario}
      />

      <TrendsetterModal
        open={trendsetterModalOpen}
        onClose={handleCloseTrendsetterModal}
        rivals={trendsetterRivals}
        onSelectTarget={handleTrendsetterTargetSelect}
        isSelecting={isSelectingTrendsetterTarget}
        diplomatGained={trendsetterGained}
        newDiplomatMS={trendsetterNewMS}
      />

      {reveredIconPending && (
        <ReveredIconModal
          open={reveredIconModalOpen}
          onClose={handleCloseReveredIconModal}
          pendingKey={reveredIconPending.pendingKey}
          rival={reveredIconPending.rival}
          perk={reveredIconPending.perk}
          cancelWindowMs={reveredIconPending.cancelWindowMs}
          expiresAt={reveredIconPending.expiresAt}
          onCancel={handleReveredIconCancel}
          isCancelling={isCancellingPerk}
        />
      )}

      {/* Fan the Flames Modal */}
      <FanTheFlamesModal
        open={!!fanTheFlamesModalOpen}
        onClose={handleCloseFanTheFlamesModal ?? (() => {})}
        offer={fanTheFlamesOffer ?? null}
        onRedirect={handleFanTheFlamesRedirect ?? (() => {})}
        isRedirecting={!!isRedirectingFanTheFlames}
      />

      {/* Danger Zone Modal */}
      <DangerZoneModal
        open={!!dangerZoneModalOpen}
        onClose={handleCloseDangerZoneModal ?? (() => {})}
        data={dangerZonePhaseData}
        onSubmit={handleSubmitDangerZone ?? (() => {})}
        isSubmitting={!!isSubmittingDangerZone}
      />

      {!targetRivalModalOpen && targetRivalModalData && (
        <Button variant="outline" onClick={handleResumeTargetRivalModal}>
          Continue {targetRivalModalData.title} selection
        </Button>
      )}

      {/* Target Rival Perk Modal (Star Power / Extortion) */}
      <TargetRivalPerkModal
        open={!!targetRivalModalOpen}
        onClose={handleCloseTargetRivalModal ?? (() => {})}
        title={targetRivalModalData?.title ?? "Target Rival"}
        description={targetRivalModalData?.description ?? "Select a rival to target."}
        rivals={targetRivalModalData?.rivals ?? []}
        onSelectTarget={handleSelectTargetRival ?? (() => {})}
        isSelecting={!!isSelectingTargetRival}
        actionText={targetRivalModalData?.actionText}
        themeColor={targetRivalModalData?.themeColor}
      />

      {/* Prophecy Scenario Prediction Modal */}
      <ScenarioPredictionModal
        open={!!predictionModalOpen}
        onClose={handleClosePredictionModal ?? (() => {})}
        onSubmit={handleScenarioPrediction ?? (() => {})}
        isSubmitting={!!isSubmittingPrediction}
      />
    </>
  );
}
