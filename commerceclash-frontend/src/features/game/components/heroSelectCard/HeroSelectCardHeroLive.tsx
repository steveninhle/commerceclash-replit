import { memo } from "react";
import { cn } from "@/lib/utils";
import { ceoBackgroundVideoFor, ceoFigureFor } from "@/pages/chooseCeo/heroArt";
import { SPACING } from "./constants";
import { HeroSelectCardPortrait } from "./HeroSelectCardPortrait";
import { HeroSelectCardForeground } from "./HeroSelectCardForeground";
import { HeroSelectCardHeader } from "./HeroSelectCardHeader";
import { HeroSelectCardTitle } from "./HeroSelectCardTitle";
import { HeroSelectCardDivider } from "./HeroSelectCardDivider";
import { HeroSelectCardSubtitle } from "./HeroSelectCardSubtitle";
import { HeroSelectCardDescription } from "./HeroSelectCardDescription";
import type { HeroSelectCardData } from "./types";

const HERO_HEADER_CLEARANCE = "pt-[8.125cqw]";

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

type HeroSelectCardHeroLiveProps = {
  hero: HeroSelectCardData;
};

const HeroBackgroundLayer = memo(function HeroBackgroundLayer({
  backgroundAsset,
  heroName,
}: {
  backgroundAsset: string;
  heroName: string;
}) {
  const backgroundVideo = ceoBackgroundVideoFor(heroName);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src={backgroundAsset}
        alt={`${heroName} backdrop`}
        decoding="async"
        className="h-full w-full object-cover object-[50%_18%] @[770px]:object-[50%_22%]"
      />
      <video
        key={backgroundVideo}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_18%] @[770px]:object-[50%_22%]"
        // Keep the static backdrop visible until an actual frame is playing.
        style={{ opacity: 0 }}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        src={backgroundVideo}
        poster={backgroundAsset}
        onPlaying={(event) => {
          event.currentTarget.style.opacity = "1";
        }}
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </div>
  );
});

const HeroSelectCardHeroLive = ({ hero }: HeroSelectCardHeroLiveProps) => {
  return (
    <div className="relative flex w-full min-h-0 flex-1 flex-col">
      <HeroBackgroundLayer
        backgroundAsset={hero.backgroundAsset}
        heroName={hero.name}
      />
      {/* <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-black/10" /> */}

      <div
        className={cn(
          "relative z-20 aspect-[4/3] sm:aspect-[16/10] md:aspect-[7/4] w-full min-h-0 flex-1 overflow-hidden",
          HERO_HEADER_CLEARANCE,
        )}
      >
        {/* Gallery backdrops contain a CEO, but the video covers that image.
            Always keep an independent figure above the decorative video. */}
        <HeroSelectCardPortrait
          portraitAsset={hero.portraitAsset ?? ceoFigureFor(hero.name)}
          heroName={hero.name}
          priority
        />
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

      <HeroTextContent
        hero={hero}
        className="relative z-20 w-full px-4 py-4 md:hidden"
      />

      <div className="absolute top-0 inset-x-0 z-50">
        <HeroSelectCardHeader tabs={hero.tabs} />
      </div>
    </div>
  );
};

export { HeroSelectCardHeroLive };
