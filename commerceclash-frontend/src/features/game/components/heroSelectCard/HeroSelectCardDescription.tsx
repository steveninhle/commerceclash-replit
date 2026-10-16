import { TYPE_SCALE } from "./constants";

type HeroSelectCardDescriptionProps = {
  description: string;
  descriptionAsset?: string;
};

const LONG_DESCRIPTION =
  "A cold strategic empire-builder operating above rules, loyalty, and ethics.";

const HeroSelectCardDescription = ({
  description,
  descriptionAsset,
}: HeroSelectCardDescriptionProps) => {
  if (!descriptionAsset && !description) {
    return null;
  }

  if (!descriptionAsset) {
    return (
      <p
        className={`${TYPE_SCALE.body} max-w-[34ch] text-center text-white/90 [text-shadow:0px_2px_4px_rgba(0,0,0,0.4)]`}
      >
        {description}
      </p>
    );
  }

  const isLongDescription = description === LONG_DESCRIPTION;

  return (
    <img
      src={descriptionAsset}
      alt={description}
      className={`w-auto max-w-full object-contain ${
        isLongDescription
          ? "h-9 sm:h-10 md:h-[62px]"
          : "h-11 sm:h-12 md:h-[84px]"
      }`}
    />
  );
};

export { HeroSelectCardDescription };
