import { cn } from "@/lib/utils";
import { studentCeoAssets } from "@/utils/helper";
import { BORDER, GLOW, RADIUS, SPACING, SURFACE } from "./constants";
import { heroThemeStyle } from "./theme";
import { HeroSelectCardHeader } from "./HeroSelectCardHeader";
import { HeroSelectCardHero } from "./HeroSelectCardHero";
import { HeroSelectCardProgress } from "./HeroSelectCardProgress";
import { HeroSelectCardLevelBadge } from "./HeroSelectCardLevelBadge";
import { HeroSelectCardPerksList } from "./HeroSelectCardPerksList";
import type { HeroSelectCardData } from "./types";

type HeroSelectCardProps = {
  hero: HeroSelectCardData;
};

const HeroSelectCard = ({ hero }: HeroSelectCardProps) => {
  return (
    <div
      style={heroThemeStyle(hero.theme)}
      className="relative flex h-full w-full flex-col overflow-hidden [container-type:inline-size]"
    >
      <HeroSelectCardHeader tabs={hero.tabs} />

      <HeroSelectCardHero hero={hero} />

      <div
        className={cn(
          "flex min-h-0 flex-col overflow-y-auto",
          SPACING.lg,
          SPACING.sectionX,
          SPACING.sectionY,
          // SPACING.panelInsetX,
          RADIUS.panel,
          BORDER.panel,
          SURFACE.panel,
          GLOW.panel,
        )}
      >
        <div className={cn("flex w-full items-center", SPACING.md)}>
          <HeroSelectCardProgress
            currentXP={hero.currentXP}
            nextLevelXP={hero.nextLevelXP}
            levelProgress={hero.level}
            accentColor={
              studentCeoAssets(hero.name)?.color ?? hero.theme.primary
            }
            characterTitle={hero.name}
          />
          <HeroSelectCardLevelBadge
            level={hero.level}
            badgeAsset={hero.levelBadgeAsset}
            numberAsset={hero.levelNumberAsset}
          />
        </div>
        <HeroSelectCardPerksList
          perks={hero.perks}
          dividerAsset={hero.lineDividerAsset}
          themeId={hero.theme.id}
        />
      </div>
    </div>
  );
};

export { HeroSelectCard };
