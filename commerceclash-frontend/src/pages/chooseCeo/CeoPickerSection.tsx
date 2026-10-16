import { CeoDetailPanel } from "./CeoDetailPanel";
import { CeoPerksPanel } from "./CeoPerksPanel";
import { getDefaultArchetype, type CeoArchetype } from "./hooks/useCeoPicker";

interface CeoPickerSectionProps {
  classId: string | null;
  archetypes: CeoArchetype[];
  isLoading: boolean;
  selectedId: string | null;
  assignedCeoId: string | null;
  confirmCeo: () => void;
  isConfirming: boolean;
}

const CeoPickerSection = ({
  classId,
  archetypes,
  isLoading,
  selectedId,
  assignedCeoId,
  confirmCeo,
  isConfirming,
}: CeoPickerSectionProps) => {
  if (!classId) {
    return (
      <div className="text-sm text-gray-400">
        {isLoading ? "Loading your class..." : "You're not enrolled in a class yet."}
      </div>
    );
  }

  if (isLoading) { 
    return <div className="text-sm text-gray-400">Loading CEOs...</div>;
  }

  const selectedHero =
    archetypes.find((a) => a.id === selectedId) ?? getDefaultArchetype(archetypes);

  if (!selectedHero) {
    return <div className="text-sm text-gray-400">No CEOs available for this class yet.</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch">
        <CeoDetailPanel
          hero={selectedHero}
          isSelectedCeo={selectedHero.id === assignedCeoId}
          isConfirming={isConfirming}
          onConfirm={confirmCeo}
        />
        <CeoPerksPanel hero={selectedHero} />
      </div>

    </div>
  );
};

export { CeoPickerSection };
