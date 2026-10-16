import { useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { ScenarioCard } from "../../components/ScenarioSelectionModal";
import type { Perk } from "./types";

interface UseTrailblazerFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  clearStatus: (perkId: string) => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

// Trailblazer: the perk owner picks one scenario card to set for the whole class.
export const useTrailblazerFlow = ({
  socket,
  courseId,
  studentId,
  clearStatus,
  onPerkUpdate,
}: UseTrailblazerFlowOptions) => {
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioCards, setScenarioCards] = useState<ScenarioCard[]>([]);
  const [trailblazerPerkId, setTrailblazerPerkId] = useState<string | null>(
    null,
  );
  const [isSelectingScenario, setIsSelectingScenario] = useState(false);

  // Handle Trailblazer scenario selection
  const handleScenarioSelect = (scenario: ScenarioCard) => {
    if (!trailblazerPerkId || isSelectingScenario) return;

    setIsSelectingScenario(true);
    toast.info(`Setting "${scenario.title}" as the class scenario...`);

    // Send the scenario selection to the backend
    socket.emit("trailblazer-scenario-selected", {
      classId: courseId,
      studentId,
      perkId: trailblazerPerkId,
      selectedScenario: scenario,
    });

    // Close modal after a short delay (server will send confirmation via perk-activated)
    setTimeout(() => {
      if (isSelectingScenario) {
        setScenarioModalOpen(false);
        setScenarioCards([]);
        setTrailblazerPerkId(null);
        setIsSelectingScenario(false);
      }
    }, 5000);
  };

  const handleCloseScenarioModal = () => {
    setScenarioModalOpen(false);
    setScenarioCards([]);
    setIsSelectingScenario(false);
    if (trailblazerPerkId) {
      socket.emit("perk-cancel", {
        classId: courseId,
        studentId,
        perkId: trailblazerPerkId,
        perkKey: "trailblazer",
      });
      clearStatus(trailblazerPerkId);
      onPerkUpdate?.(
        { id: trailblazerPerkId },
        { status: null, used: false },
      );
    }
    setTrailblazerPerkId(null);
  };

  return {
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
  };
};
