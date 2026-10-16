import { cn } from "@/lib/utils";
import { DISPLAY_FONT } from "./constants";

type HeroSelectCardTitleProps = {
  namePrefixAsset?: string;
  nameAsset?: string;
  heroName: string;
};

const HeroSelectCardTitle = ({
  namePrefixAsset,
  nameAsset,
  heroName,
}: HeroSelectCardTitleProps) => {
  return (
    <div className="flex flex-col items-center">
      {namePrefixAsset ? (
        <img
          src={namePrefixAsset}
          alt="The"
          className="h-4 sm:h-[32px] w-auto mb-[4px]"
        />
      ) : (
        <span
          className={cn(
            DISPLAY_FONT,
            "text-[var(--hs-primary)] text-base uppercase tracking-[0.15em] sm:text-lg md:text-2xl",
            "[text-shadow:0px_1px_3px_rgba(0,0,0,0.15),0px_2px_4px_rgba(0,0,0,0.5)]",
          )}
        >
          The
        </span>
      )}
      {nameAsset ? (
        <img
          src={nameAsset}
          alt={heroName}
          className="h-12 sm:h-[58px] w-auto"
        />
      ) : (
        <h1
          className={cn(
            DISPLAY_FONT,
            "!text-[var(--hs-primary)] !text-[42px] !uppercase !leading-none sm:!text-[56px] md:!text-[68px]",
            "![text-shadow:0px_1px_3px_rgba(0,0,0,0.15),0px_2px_4px_rgba(0,0,0,0.5)]",
          )}
        >
          {heroName.replace(/^the\s+/i, "")}
        </h1>
      )}
    </div>
  );
};

export { HeroSelectCardTitle };
