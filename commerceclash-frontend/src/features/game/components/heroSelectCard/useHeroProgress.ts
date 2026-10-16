import { useMemo } from "react";

const calculateXpPercentage = (currentXP: number, nextLevelXP: number): number => {
  if (nextLevelXP <= 0) return 0;
  return Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));
};

const useHeroProgress = (currentXP: number, nextLevelXP: number) => {
  const percentage = useMemo(
    () => calculateXpPercentage(currentXP, nextLevelXP),
    [currentXP, nextLevelXP],
  );

  return { percentage };
};

export { useHeroProgress };
