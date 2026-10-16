import { Z_INDEX } from "./constants";

type HeroSelectCardForegroundProps = {
  foregroundAsset: string;
};

const HeroSelectCardForeground = ({
  foregroundAsset,
}: HeroSelectCardForegroundProps) => {
  return (
    <div
      className={`absolute left-0 w-[82.4%] top-[40.2%] sm:top-[38.3%] md:top-[37.2%] ${Z_INDEX.foreground}`}
    >
      <img
        src={foregroundAsset}
        alt=""
        aria-hidden
        className="block h-auto w-full"
      />
    </div>
  );
};

export { HeroSelectCardForeground };
