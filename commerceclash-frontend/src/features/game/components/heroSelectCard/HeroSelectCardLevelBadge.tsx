import { cn } from "@/lib/utils";
import { CHROME_TEXT, DISPLAY_FONT, GLOW, IMG } from "./constants";

type HeroSelectCardLevelBadgeProps = {
  level: number;
  badgeAsset: string;
  numberAsset?: string;
  themeId?: string;

  className?: string;
};

const HeroSelectCardLevelBadge = ({
  level,
  badgeAsset,
  numberAsset,
  themeId,
  className,
}: HeroSelectCardLevelBadgeProps) => {
  const isBaron = themeId === "baron";

  return (
    <div
      className={cn(
        "relative h-[15.25cqw] w-[15.25cqw] shrink-0",
        isBaron && "h-[13cqw] w-[13cqw]",
        className,
      )}
    >
      <img
        src={badgeAsset}
        alt={`Level ${level} badge`}
        className={cn("h-full w-full", IMG.contain, GLOW.levelBadge)}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-[8%]">
        {numberAsset ? (
          <img
            src={numberAsset}
            alt={String(level)}
            className={cn("h-[45%] w-auto", isBaron && "mt-2")}
          />
        ) : (
          <span
            className={cn(
              DISPLAY_FONT,
              CHROME_TEXT,
              "text-3xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.25)]",
              isBaron && "mt-2",
            )}
          >
            {level}
          </span>
        )}
      </div>
    </div>
  );
};

export { HeroSelectCardLevelBadge };
