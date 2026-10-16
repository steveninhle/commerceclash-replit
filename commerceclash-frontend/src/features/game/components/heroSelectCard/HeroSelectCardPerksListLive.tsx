import { SPACING } from "./constants";
import { HeroSelectCardPerkItemLive } from "./HeroSelectCardPerkItemLive";
import { sortPerksByType } from "../../utils/sortPerksByType";
import type { Perk } from "../../hooks/heroCard/types";
import type { HeroSelectCardPerk } from "./types";

type HeroSelectCardPerksListLiveProps = {
  perks: Perk[];
  visuals?: HeroSelectCardPerk[];
  dividerAsset?: string;
  themeId: string;
  getEffectiveStatus: (perk: Perk) => string | null;
  onActivate: (perkId: string, title: string) => void;
};

const HeroSelectCardPerksListLive = ({
  perks,
  visuals,
  dividerAsset,
  themeId,
  getEffectiveStatus,
  onActivate,
}: HeroSelectCardPerksListLiveProps) => {
  return (
    <div
      aria-label="Hero perks"
      className={`flex w-full list-none flex-col ${SPACING.perkGap}`}
    >
      {sortPerksByType(perks).map((perk, index) => {
        const visual =
          visuals?.find(
            (v) =>
              (perk.key &&
                v.id.toLowerCase().replace(/[\s-]/g, "_") ===
                  perk.key.toLowerCase().replace(/[\s-]/g, "_")) ||
              v.name.toLowerCase() === perk.title.toLowerCase(),
          ) ?? visuals?.[index];

        return (
          <HeroSelectCardPerkItemLive
            key={perk.id}
            perk={perk}
            visual={visual}
            dividerAsset={dividerAsset}
            themeId={themeId}
            getEffectiveStatus={getEffectiveStatus}
            onActivate={onActivate}
          />
        );
      })}
    </div>
  );
};

export { HeroSelectCardPerksListLive };
