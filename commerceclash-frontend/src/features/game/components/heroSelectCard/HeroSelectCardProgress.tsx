import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import {
  normalizeCharacterTitle,
  scoreXpCeoImage,
  studentCeoAssets,
} from "@/utils/helper";
import { HERO_GALLERY_DATA } from "./heroesData";

import { CHROME_TEXT, DISPLAY_FONT, TEXT_COLOR, TYPE_SCALE } from "./constants";

const FILL_DURATION = 400;

type HeroSelectCardProgressProps = {
  currentXP?: number;
  nextLevelXP: number;
  levelProgress?: number;
  accentColor?: string;
  characterTitle?: string | null;
};

const HeroSelectCardProgress = ({
  currentXP = 0,
  nextLevelXP,
  levelProgress = 1,
  accentColor,
  characterTitle,
}: HeroSelectCardProgressProps) => {
  const level = levelProgress ?? 1;
  const targetXp = currentXP;

  const resolvedAccentColor =
    accentColor ??
    (characterTitle
      ? studentCeoAssets(characterTitle)?.color ??
        HERO_GALLERY_DATA.find(
          (h) =>
            normalizeCharacterTitle(h.name) ===
            normalizeCharacterTitle(characterTitle),
        )?.theme.primary
      : undefined);

  const scoreImage = scoreXpCeoImage(characterTitle);

  const [displayXp, setDisplayXp] = useState(targetXp);
  const [animated, setAnimated] = useState(true);

  const prevLevelRef = useRef(level);
  const animatingRef = useRef(false);

  useEffect(() => {
    const oldLevel = prevLevelRef.current;
    const levelsGained = level - oldLevel;

    if (levelsGained <= 0) {
      prevLevelRef.current = level;

      setAnimated(true);
      setDisplayXp(targetXp);

      return;
    }

    if (animatingRef.current) return;

    prevLevelRef.current = level;
    animatingRef.current = true;

    const steps: number[] = [];

    for (let l = oldLevel + 1; l <= level; l++) {
      steps.push(l);
    }

    let stepIndex = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const frames: number[] = [];
    let cancelled = false;

    const runStep = () => {
      if (cancelled) return;
      const isLastStep = stepIndex === steps.length - 1;

      const overflowXp = isLastStep ? targetXp : 0;

      setAnimated(true);
      setDisplayXp(nextLevelXP);

      const t1 = setTimeout(() => {
        if (cancelled) return;
        setAnimated(false);
        setDisplayXp(0);

        frames.push(requestAnimationFrame(() => {
          if (cancelled) return;
          frames.push(requestAnimationFrame(() => {
            if (cancelled) return;
            setAnimated(true);
            setDisplayXp(overflowXp);

            const t2 = setTimeout(() => {
              stepIndex++;

              if (stepIndex < steps.length) {
                runStep();
              } else {
                animatingRef.current = false;
              }
            }, FILL_DURATION + 200);

            timers.push(t2);
          }));
        }));
      }, FILL_DURATION);

      timers.push(t1);
    };

    runStep();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
      animatingRef.current = false;
    };
  }, [targetXp, level, nextLevelXP]);

  const percentage =
    nextLevelXP > 0
      ? Math.min(100, Math.max(0, (displayXp / nextLevelXP) * 100))
      : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <div
        className={cn(
          "relative h-11 w-full overflow-hidden rounded-md border bg-gray-800/40",
          resolvedAccentColor
            ? "!border-[var(--progress-border-color)]"
            : "border-white/10",
        )}
        style={
          resolvedAccentColor
            ? {
                borderColor: resolvedAccentColor,
                ["--progress-border-color" as string]: resolvedAccentColor,
                boxShadow: `0 0 10px color-mix(in srgb, ${resolvedAccentColor} 50%, transparent)`,
              }
            : undefined
        }
      >
        <div
          className="absolute top-0 left-0 h-full overflow-hidden rounded-r-md"
          style={{
            width: `${percentage}%`,
            transition: animated ? `width ${FILL_DURATION}ms ease-out` : "none",
          }}
        >
          <img src={scoreImage} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] min-[550px]:text-lg">
          {displayXp} / {nextLevelXP} XP
        </div>
      </div>

      {/* Next level */}
      <p
        className={cn("text-center", TYPE_SCALE.caption, TEXT_COLOR.accentRed)}
      >
        NEXT LEVEL:{" "}
        <span
          className={cn(
            DISPLAY_FONT,
            CHROME_TEXT,
            "!tracking-wide",
            "!text-[14px]",
            "[text-shadow:2px_2px_4px_rgba(0,0,0,0.25)]",
          )}
        >
          {nextLevelXP} XP
        </span>
      </p>
    </div>
  );
};

export { HeroSelectCardProgress };
