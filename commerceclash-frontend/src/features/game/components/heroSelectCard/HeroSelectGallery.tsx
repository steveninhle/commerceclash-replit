import { memo } from "react";
import { HeroSelectCard } from "./HeroSelectCard";
import type { HeroSelectCardData } from "./types";

type HeroSelectGalleryProps = {
  heroes: HeroSelectCardData[];
};

const HeroSelectGalleryComponent = ({ heroes }: HeroSelectGalleryProps) => {
  return (
    <div
      role="list"
      aria-label="Choose your hero"
      className="scrollbar-hide flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 py-6 sm:gap-6 sm:px-8 md:px-12"
    >
      {heroes.map((hero) => (
        <div
          role="listitem"
          key={hero.theme.id}
          className="w-[88vw] shrink-0 snap-center sm:w-[70vw] md:w-[560px] lg:w-[620px] xl:w-[680px]"
        >
          <HeroSelectCard hero={hero} />
        </div>
      ))}
    </div>
  );
};

const HeroSelectGallery = memo(HeroSelectGalleryComponent);

export { HeroSelectGallery };
