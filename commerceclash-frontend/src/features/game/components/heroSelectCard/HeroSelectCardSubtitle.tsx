import { cn } from "@/lib/utils";
import { DISPLAY_FONT } from "./constants";

type HeroSelectCardSubtitleProps = {
  subtitleAsset?: string;
  subtitle: string;
};

const HeroSelectCardSubtitle = ({
  subtitleAsset,
  subtitle,
}: HeroSelectCardSubtitleProps) => {
  if (!subtitleAsset) {
    return (
      <p
        className={cn(
          DISPLAY_FONT,
          "text-[var(--hs-primary)] text-center text-base uppercase tracking-[0.12em] sm:text-lg md:text-xl",
          "[text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]",
        )}
      >
        {subtitle}
      </p>
    );
  }

  return (
    <img
      src={subtitleAsset}
      alt={subtitle}
      className="h-5 sm:h-[34px] w-auto"
    />
  );
};

export { HeroSelectCardSubtitle };
