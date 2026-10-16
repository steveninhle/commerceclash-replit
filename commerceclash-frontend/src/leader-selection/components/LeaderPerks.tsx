import type { Leader } from "../types";
import { PerkCard } from "./PerkCard";

interface LeaderPerksProps {
  leader: Leader;
}

/** The "Perks" card: the signature abilities tied to the selected leader. */
export const LeaderPerks = ({ leader }: LeaderPerksProps) => {
  return (
    <section
      aria-label="Leader perks"
      className="flex flex-col gap-4 rounded-2xl border border-amber-200/10 bg-white/[0.02] p-4 sm:p-5"
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
        Perks
      </h3>
      <div className="flex flex-col gap-3.5">
        {leader.perks.map((perk) => (
          <PerkCard key={perk.id} perk={perk} color={leader.color} />
        ))}
      </div>
    </section>
  );
};
