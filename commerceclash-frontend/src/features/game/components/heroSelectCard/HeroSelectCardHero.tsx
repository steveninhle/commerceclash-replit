import { cn } from "@/lib/utils";
import { SPACING } from "./constants";
import { HeroSelectCardBackground } from "./HeroSelectCardBackground";
import { HeroSelectCardPortrait } from "./HeroSelectCardPortrait";
import { HeroSelectCardForeground } from "./HeroSelectCardForeground";
import { HeroSelectCardTitle } from "./HeroSelectCardTitle";
import { HeroSelectCardDivider } from "./HeroSelectCardDivider";
import { HeroSelectCardSubtitle } from "./HeroSelectCardSubtitle";
import { HeroSelectCardDescription } from "./HeroSelectCardDescription";
import type { HeroSelectCardData } from "./types";

type HeroTextContentProps = {
  hero: HeroSelectCardData;
  className?: string;
  dividerClassName?: string;
};

const HeroTextContent = ({
  hero,
  className,
  dividerClassName = "h-7 w-auto",
}: HeroTextContentProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        SPACING.sm,
        className,
      )}
    >
      <HeroSelectCardTitle
        namePrefixAsset={hero.namePrefixAsset}
        nameAsset={hero.nameAsset}
        heroName={hero.name}
      />
      <HeroSelectCardDivider
        asset={hero.ornateDividerAsset}
        className={dividerClassName}
      />
      <HeroSelectCardSubtitle
        subtitleAsset={hero.subtitleAsset}
        subtitle={hero.subtitle}
      />
      <HeroSelectCardDescription
        description={hero.description}
        descriptionAsset={hero.descriptionAsset}
      />
      <HeroSelectCardDivider
        asset={hero.lineDividerAsset}
        className="h-6 w-40 lg:w-48"
      />
    </div>
  );
};

type HeroSelectCardHeroProps = {
  hero: HeroSelectCardData;
};

// flex-1 min-h-0 on both this wrapper and the image box below is a no-op
// when the card's own height is content-driven (HeroSelectGallery — no
// extra space to distribute, so each renders at its aspect-ratio height)
// and becomes "fill whatever's left after the header/panel" when the card
// is h-full-constrained (HeroCard drop-in slot) — same flexbox mechanics
// HeroCard itself relies on for its full-bleed background image.
const HeroSelectCardHero = ({ hero }: HeroSelectCardHeroProps) => {
  return (
    <div className="relative flex w-full min-h-0 flex-1 flex-col">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[7/4] w-full min-h-0 flex-1 overflow-hidden">
        <HeroSelectCardBackground
          backgroundAsset={hero.backgroundAsset}
          heroName={hero.name}
        />
        {hero.portraitAsset && (
          <HeroSelectCardPortrait
            portraitAsset={hero.portraitAsset}
            heroName={hero.name}
          />
        )}
        {hero.foregroundAsset && (
          <HeroSelectCardForeground foregroundAsset={hero.foregroundAsset} />
        )}

        <div className="relative z-20 hidden h-full w-full items-center md:flex">
          <div className="w-[40%] lg:w-[55%]" />
          <HeroTextContent
            hero={hero}
            className="w-[60%] px-4 lg:w-[45%] lg:px-6"
            dividerClassName="h-7 lg:h-10 w-auto"
          />
        </div>
      </div>

      <HeroTextContent hero={hero} className="w-full px-4 py-4 md:hidden" />
    </div>
  );
};

export { HeroSelectCardHero };
