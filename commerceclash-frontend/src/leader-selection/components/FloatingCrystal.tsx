import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface FloatingCrystalProps {
  icon: LucideIcon;
  color: string;
  animationKey: string;
}

/** Decorative emblem that hovers beside the hero artwork with a slow float loop. */
export const FloatingCrystal = ({ icon: Icon, color, animationKey }: FloatingCrystalProps) => {
  return (
    <motion.span
      key={animationKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
      }}
      aria-hidden="true"
      className="absolute right-[18%] top-[16%] z-10 flex size-12 items-center justify-center rounded-xl border backdrop-blur-sm sm:size-14"
      style={{
        backgroundColor: `${color}22`,
        borderColor: `${color}55`,
        color,
        boxShadow: `0 0 24px -4px ${color}`,
      }}
    >
      <Icon className="size-6" aria-hidden="true" />
    </motion.span>
  );
};
