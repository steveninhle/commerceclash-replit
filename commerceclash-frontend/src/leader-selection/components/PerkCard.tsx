import type { LeaderPerk } from "../types";

interface PerkCardProps {
  perk: LeaderPerk;
  color: string;
}

/** One perk row: a hexagonal icon badge next to the perk's name. */
export const PerkCard = ({ perk, color }: PerkCardProps) => {
  return (
    <div className="group flex items-center gap-3" title={perk.description}>
      <span
        className="flex size-9 shrink-0 items-center justify-center [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]"
        style={{ backgroundColor: `${color}26`, color }}
      >
        <perk.icon className="size-4" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-bold uppercase tracking-wider text-white/80">
        {perk.title}
      </span>
      <span className="sr-only">{perk.description}</span>
    </div>
  );
};
