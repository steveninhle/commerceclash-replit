import { studentCeoAssets } from "@/utils/helper";
import { heroArtFor, heroDescriptionFor } from "./heroArt";
import type { CeoArchetype } from "./hooks/useCeoPicker";

interface CeoDetailPanelProps {
  hero: CeoArchetype;
  isSelectedCeo: boolean;
  isConfirming: boolean;
  onConfirm: () => void;
}

const CeoDetailPanel = ({
  hero,
  isSelectedCeo,
  isConfirming,
  onConfirm,
}: CeoDetailPanelProps) => {
  const assets = studentCeoAssets(hero.title);
  const art = heroArtFor(hero.title);
  const description = heroDescriptionFor(hero.title);

  return (
    <div
      className="relative flex w-full max-w-md flex-1 flex-col items-center overflow-hidden rounded-2xl border bg-black/70 px-6 pt-8 pb-6 text-center"
      style={{ borderColor: `${assets.color}80` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 15%, ${assets.color}33 0%, transparent 60%)`,
        }}
      />

      {art && (
        <img
          src={art}
          alt={hero.title}
          className="relative z-10 h-56 w-auto object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.6)]"
        />
      )}

      <div className={`relative z-10 mt-2 text-3xl font-extrabold ${assets.text}`}>
        {hero.title.toUpperCase()}
      </div>
      <div className="relative z-10 text-sm font-semibold tracking-[0.2em] text-gray-300 uppercase">
        {hero.sub_title}
      </div>

      {description && (
        <p className="relative z-10 mt-3 max-w-xs text-sm text-gray-400">{description}</p>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={isConfirming || isSelectedCeo}
        className={`relative z-10 mt-6 rounded-full border-2 px-8 py-2 text-sm font-extrabold tracking-wide uppercase transition disabled:cursor-not-allowed ${
          isSelectedCeo ? "border-white/20 text-white/50" : "text-white"
        }`}
        style={
          isSelectedCeo
            ? undefined
            : { borderColor: assets.color, boxShadow: `0 0 16px ${assets.color}55` }
        }
      >
        {isSelectedCeo ? "Current CEO" : isConfirming ? "Confirming..." : "Confirm CEO"}
      </button>
    </div>
  );
};

export { CeoDetailPanel };
