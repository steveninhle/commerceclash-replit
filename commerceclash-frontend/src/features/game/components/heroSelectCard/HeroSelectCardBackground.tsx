import { Z_INDEX } from "./constants";

type HeroSelectCardBackgroundProps = {
  backgroundAsset: string;
  heroName: string;
};

// Base scene layer + a dark gradient overlay so foreground text stays
// legible regardless of how bright the underlying photo is.
const HeroSelectCardBackground = ({
  backgroundAsset,
  heroName,
}: HeroSelectCardBackgroundProps) => {
  return (
    <div className={`absolute inset-0 ${Z_INDEX.background}`}>
      <img
        src={backgroundAsset}
        alt={`${heroName} backdrop`}
        className="h-full w-full object-cover"
      />
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" /> */}
    </div>
  );
};

export { HeroSelectCardBackground };
