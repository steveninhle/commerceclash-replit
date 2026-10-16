import { Eye, Shield, Swords, Users } from "lucide-react";
import type { Leader } from "../types";
import { STAT_COLORS } from "../utils";
import { StatProgress } from "./StatProgress";

interface LeaderStatsCardProps {
  leader: Leader;
}

const STAT_ROWS = [
  { key: "strategy", label: "Strategy", icon: Swords },
  { key: "control", label: "Control", icon: Shield },
  { key: "vision", label: "Vision", icon: Eye },
  { key: "influence", label: "Influence", icon: Users },
] as const;

/** The "Playstyle" card: four color-coded stat meters for whichever leader is selected. */
export const LeaderStatsCard = ({ leader }: LeaderStatsCardProps) => {
  return (
    <section
      aria-label="Playstyle stats"
      className="flex flex-col gap-4 rounded-2xl border border-amber-200/10 bg-white/[0.02] p-4 sm:p-5"
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        Playstyle
      </h3>
      <div className="flex flex-col gap-3">
        {STAT_ROWS.map((row) => (
          // Remount on leader change so the fill animates in fresh, rather than
          // tweening between two leaders' unrelated segment counts.
          <StatProgress
            key={`${leader.id}-${row.key}`}
            label={row.label}
            icon={row.icon}
            value={leader[row.key]}
            color={STAT_COLORS[row.key]}
          />
        ))}
      </div>
    </section>
  );
};
