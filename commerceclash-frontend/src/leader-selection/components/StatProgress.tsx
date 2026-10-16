import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { clampPercent, getFilledSegments } from "../utils";

interface StatProgressProps {
  label: string;
  icon: LucideIcon;
  value: number;
  color: string;
}

const SEGMENTS = [0, 1, 2, 3, 4];

/** Icon + label + a 5-block discrete meter, reused for every playstyle stat row. */
export const StatProgress = ({ label, icon: Icon, value, color }: StatProgressProps) => {
  const percent = clampPercent(value);
  const filled = getFilledSegments(percent);

  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0" style={{ color }} aria-hidden="true" />
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-white/50 sm:w-24">
        {label}
      </span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex flex-1 gap-1"
      >
        {SEGMENTS.map((segment) => (
          <motion.span
            key={segment}
            initial={{ opacity: 0 }}
            animate={{ opacity: segment < filled ? 1 : 0.18 }}
            transition={{ duration: 0.25, delay: segment * 0.04 }}
            className="h-2 flex-1 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};
