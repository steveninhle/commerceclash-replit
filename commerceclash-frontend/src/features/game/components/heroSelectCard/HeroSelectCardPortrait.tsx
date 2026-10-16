import { Z_INDEX } from "./constants";

type HeroSelectCardPortraitProps = {
  portraitAsset: string;
  heroName: string;
  priority?: boolean;
};

const HeroSelectCardPortrait = ({
  portraitAsset,
  heroName,
  priority = false,
}: HeroSelectCardPortraitProps) => {
  return (
    <div
      className={`absolute inset-y-0 left-0 h-full w-[62%] md:w-[40%] lg:w-[55%] ${Z_INDEX.portrait}`}
    >
      <img
        src={portraitAsset}
        alt={heroName}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        className="h-full w-full object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
};

export { HeroSelectCardPortrait };
