import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  badgeCeoImage,
  scoreXpCeoImage,
  studentCeoAssets,
} from "@/utils/helper";

const XP_PER_LEVEL = 10;
const MAX_LEVEL = 5;
const FILL_DURATION = 400;

interface ProgressBarProps {
  xpProgress: number;
  levelProgress?: number;
  maxValue?: number;
  showCounter?: boolean;
  accentColor?: string;
  showXpLabel?: boolean;
  characterTitle?: string | null;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  xpProgress,
  levelProgress = 1,
  showCounter = true,
  accentColor,
  showXpLabel = false,
  characterTitle,
}) => {
  const resolvedColor =
    accentColor ??
    (characterTitle ? studentCeoAssets(characterTitle)?.color : undefined);
  const badgeColor = resolvedColor ?? "#56FFD0";
  const scoreImage = scoreXpCeoImage(characterTitle);
  const badgeImage = badgeCeoImage(characterTitle);
  const level = levelProgress ?? 1;
  const targetXp =
    level >= MAX_LEVEL ? XP_PER_LEVEL : xpProgress % XP_PER_LEVEL;

  const [displayXp, setDisplayXp] = useState(targetXp);
  const [displayLevel, setDisplayLevel] = useState(level);
  const [animated, setAnimated] = useState(true);
  const [dinging, setDinging] = useState(false);

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

    if (animatingRef.current) return; // guard against overlapping runs

    prevLevelRef.current = level;
    animatingRef.current = true;

    // Build a queue of intermediate level-up steps
    // e.g. level 2→5: steps = [3, 4, 5]
    const steps: number[] = [];
    for (let l = oldLevel + 1; l <= level; l++) {
      steps.push(l);
    }

    let stepIndex = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runStep = () => {
      const nextLevel = steps[stepIndex];
      const isLastStep = stepIndex === steps.length - 1;
      const overflowXp = isLastStep ? targetXp : 0; // only last step has overflow

      // Fill bar to 100%
      setAnimated(true);
      setDisplayXp(XP_PER_LEVEL);

      const t1 = setTimeout(() => {
        // Flip level + ding
        setDisplayLevel(nextLevel);
        setDinging(true);

        // At max level — stay full, no reset
        if (nextLevel >= MAX_LEVEL) {
          const t2 = setTimeout(() => {
            setDinging(false);
            animatingRef.current = false;
          }, 1000);
          timers.push(t2);
          return;
        }

        // Snap bar to 0, then fill to overflow XP
        setAnimated(false);
        setDisplayXp(0);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimated(true);
            setDisplayXp(overflowXp);

            const t2 = setTimeout(() => {
              setDinging(false);
              stepIndex++;
              if (stepIndex < steps.length) {
                runStep();
              } else {
                animatingRef.current = false;
              }
            }, FILL_DURATION + 200);

            timers.push(t2);
          });
        });
      }, FILL_DURATION);

      timers.push(t1);
    };

    runStep();

    return () => {
      timers.forEach(clearTimeout);
      animatingRef.current = false;
    };
  }, [xpProgress, level]); // eslint-disable-line react-hooks/exhaustive-deps

  const percentage = Math.min(
    100,
    Math.max(0, (displayXp / XP_PER_LEVEL) * 100),
  );

  return (
    <div className="flex items-center w-full">
      <div
        className={cn(
          "relative flex-1 h-11 bg-gray-800/40 rounded-md border overflow-hidden",
          resolvedColor
            ? "!border-[var(--progress-border-color)]"
            : "border-white/10",
        )}
        style={
          resolvedColor
            ? {
                borderColor: resolvedColor,
                ["--progress-border-color" as string]: resolvedColor,
                boxShadow: `0 0 10px color-mix(in srgb, ${resolvedColor} 50%, transparent)`,
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
          <img src={scoreImage} alt="" className="w-auto h-full object-cover" />
        </div>

        {showXpLabel && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm min-[550px]:text-lg font-bold tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
            {displayXp} / {XP_PER_LEVEL} XP
          </div>
        )}
      </div>

      {showCounter && (
        <div className="relative flex items-center justify-center flex-shrink-0 w-25 h-25">
          {dinging && (
            <div
              className="absolute w-9 h-9 rounded-full border-2 animate-ping opacity-75"
              style={{
                borderColor: badgeColor,
                animationDuration: "0.6s",
              }}
            />
          )}
          <img
            src={badgeImage}
            alt=""
            className={`absolute inset-0 w-full h-full object-contain transition-transform duration-300 ${dinging ? "scale-125" : ""}`}
          />
          <span
            className={`relative flex items-center justify-center pb-[8%] text-white text-3xl font-bold `}
          >
            {displayLevel}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
