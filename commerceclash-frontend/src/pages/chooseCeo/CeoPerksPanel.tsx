import { Sparkles } from "lucide-react";
import { studentCeoAssets } from "@/utils/helper";
import type { CeoArchetype } from "./hooks/useCeoPicker";

const CeoPerksPanel = ({ hero }: { hero: CeoArchetype }) => {
  const assets = studentCeoAssets(hero.title);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {hero.perks.map((perk) => (
        <div
          key={perk.id}
          className="flex items-start gap-3 rounded-xl border bg-black/60 p-3 text-left"
          style={{ borderColor: `${assets.color}55` }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${assets.color}22`, border: `1px solid ${assets.color}` }}
          >
            <Sparkles className="h-5 w-5" style={{ color: assets.color }} />
          </div>
          <div className="min-w-0">
            <div className={`text-sm font-extrabold uppercase ${assets.text}`}>{perk.title}</div>
            <div className="text-xs text-gray-400">{perk.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { CeoPerksPanel };
