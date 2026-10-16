import { useState } from "react";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";
import type { RivalSkill as SabotageSkill } from "../../components/SabotageRedistributeModal";
import type { SabotageRival, Perk } from "./types";

interface UseSabotageFlowOptions {
  socket: Socket;
  courseId: string | null;
  studentId: string;
  clearStatus: (perkId: string) => void;
  onPerkUpdate?: (
    selector: { id?: string | null; key?: string | null },
    patch: Partial<Perk>,
  ) => void;
}

// Sabotage is a two-phase perk: pick a rival target (phase 1), then
// redistribute up to 3 of their skill points (phase 2).
export const useSabotageFlow = ({
  socket,
  courseId,
  studentId,
  clearStatus,
  onPerkUpdate,
}: UseSabotageFlowOptions) => {
  // Phase 1: target selection
  const [sabotageModalOpen, setSabotageModalOpen] = useState(false);
  const [sabotageRivals, setSabotageRivals] = useState<SabotageRival[]>([]);
  const [sabotagePerkId, setSabotagePerkId] = useState<string | null>(null);
  const [isSelectingTarget, setIsSelectingTarget] = useState(false);

  // Phase 2: redistribution
  const [sabotageRedistributeModalOpen, setSabotageRedistributeModalOpen] =
    useState(false);
  const [sabotageTargetId, setSabotageTargetId] = useState<string | null>(
    null,
  );
  const [sabotageTargetName, setSabotageTargetName] = useState<string>("");
  const [sabotageSkillTree, setSabotageSkillTree] = useState<SabotageSkill[]>(
    [],
  );
  const [isRedistributing, setIsRedistributing] = useState(false);

  // Handle sabotage target selection (Phase 1 → triggers Phase 2)
  const handleSabotageTargetSelect = (targetId: string) => {
    if (!sabotagePerkId || isSelectingTarget) return;

    setIsSelectingTarget(true);
    toast.info("Loading rival's skill tree...");

    // Send the target selection to get the skill tree for redistribution
    socket.emit("perk-complete-with-target", {
      classId: courseId,
      studentId,
      perkId: sabotagePerkId,
      targetStudentId: targetId,
    });

    // Note: Modal will transition to redistribution modal when perk-activated event is received
    // with phase 2 data (skill tree)
  };

  // Handle sabotage redistribution submission (Phase 2 → Final)
  const handleSabotageRedistribute = (redistribution: {
    decrements: { skillId: string; amount: number }[];
    increments: { skillId: string; amount: number }[];
  }) => {
    if (!sabotagePerkId || !sabotageTargetId || isRedistributing) return;

    setIsRedistributing(true);
    toast.info("Applying sabotage...");

    // Send the redistribution to complete the sabotage
    socket.emit("perk-complete-with-target", {
      classId: courseId,
      studentId,
      perkId: sabotagePerkId,
      targetStudentId: sabotageTargetId,
      redistribution: redistribution,
    });

    // Note: Modal will be closed when perk-activated event is received with perk_status='used'
  };

  const handleCloseSabotageModal = () => {
    setSabotageModalOpen(false);
    setSabotageRivals([]);
    setIsSelectingTarget(false);
    if (sabotagePerkId) {
      socket.emit("perk-cancel", {
        classId: courseId,
        studentId,
        perkId: sabotagePerkId,
        perkKey: "sabotage",
      });
      clearStatus(sabotagePerkId);
      onPerkUpdate?.(
        { id: sabotagePerkId },
        { status: null, used: false },
      );
    }
    setSabotagePerkId(null);
  };

  const handleCloseSabotageRedistributeModal = () => {
    setSabotageRedistributeModalOpen(false);
    setSabotageTargetId(null);
    setSabotageTargetName("");
    setSabotageSkillTree([]);
    setIsRedistributing(false);
    if (sabotagePerkId) {
      socket.emit("perk-cancel", {
        classId: courseId,
        studentId,
        perkId: sabotagePerkId,
        perkKey: "sabotage",
      });
      clearStatus(sabotagePerkId);
      onPerkUpdate?.(
        { id: sabotagePerkId },
        { status: null, used: false },
      );
    }
    setSabotagePerkId(null);
  };

  return {
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
  };
};
