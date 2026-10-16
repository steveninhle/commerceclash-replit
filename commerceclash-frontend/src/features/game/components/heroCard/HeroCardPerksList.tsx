import { PowerupCard } from "../PowerUpButton";
import { sortPerksByType } from "../../utils/sortPerksByType";
import type { Perk } from "../../hooks/heroCard/types";

interface HeroCardPerksListProps {
  perks: Perk[];
  getEffectiveStatus: (perk: Perk) => string | null;
  onActivate: (perkId: string, title: string) => void;
}

export function HeroCardPerksList({
  perks,
  getEffectiveStatus,
  onActivate,
}: HeroCardPerksListProps) {
  return (
    <div
      className="flex flex-col gap-[6.5px] min-[550px]:gap-3 min-[450px]:gap-[11px] sm:gap-[14px] md:gap-[15px]  mt-2 max-[450px]:mt-1 lg:gap-5 px-4 max-[550px]:px-3 max-[450px]:px-[10px] sm:px-5 pb-5 max-[450px]:pb-3 pt-1 overflow-y-auto"
      style={{ scrollbarWidth: "thin" }}
    >
      {sortPerksByType(perks).map((perk) => (
        <PowerupCard
          key={perk.id}
          title={perk.title}
          description={perk.description}
          onAction={() => onActivate(perk.id, perk.title)}
          className="w-full"
          unlocked={perk.is_unlocked}
          perkStatus={getEffectiveStatus(perk)}
          isUsed={perk.used}
          perk_type={perk.perk_type}
        />
      ))}
    </div>
  );
}
