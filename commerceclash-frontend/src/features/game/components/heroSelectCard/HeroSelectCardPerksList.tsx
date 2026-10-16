import { memo } from "react";
import { HeroSelectCardPerkItem } from "./HeroSelectCardPerkItem";
import type { HeroSelectCardPerk } from "./types";

type HeroSelectCardPerksListProps = {
  perks: HeroSelectCardPerk[];
  dividerAsset?: string;
  themeId: string;
};

const HeroSelectCardPerksListComponent = ({
  perks,
  dividerAsset,
  themeId,
}: HeroSelectCardPerksListProps) => {
  return (
    <div aria-label="Hero perks" className={`flex w-full list-none flex-col `}>
      {perks.map((perk: HeroSelectCardPerk) => (
        <HeroSelectCardPerkItem
          key={perk.id}
          perk={perk}
          dividerAsset={dividerAsset}
          themeId={themeId}
        />
      ))}
    </div>
  );
};

const HeroSelectCardPerksList = memo(HeroSelectCardPerksListComponent);

export { HeroSelectCardPerksList };
