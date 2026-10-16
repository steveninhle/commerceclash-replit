import { useState } from "react";
import type { RivalSkillTree } from "./types";

// One-time "reveal" modal shown right when Corporate Espionage activates and
// the server sends back the rival skill trees. Distinct from useEspionage.ts,
// which drives the persistent Skills-tab lock elsewhere in the app.
export const useCorporateEspionageReveal = () => {
  const [skillTreesModalOpen, setSkillTreesModalOpen] = useState(false);
  const [rivalSkillTrees, setRivalSkillTrees] = useState<RivalSkillTree[]>([]);

  // Handle closing the Corporate Espionage skill trees modal (one-time use - expires forever)
  const handleCloseSkillTreesModal = () => {
    setSkillTreesModalOpen(false);
    setRivalSkillTrees([]);
    // Perk already marked as used by perk-activated event handler
  };

  return {
    skillTreesModalOpen,
    setSkillTreesModalOpen,
    rivalSkillTrees,
    setRivalSkillTrees,
    handleCloseSkillTreesModal,
  };
};
