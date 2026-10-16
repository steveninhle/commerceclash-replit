import { normalizeCharacterTitle, studentCeoAssets } from "@/utils/helper";
import type { CeoArchetype } from "./hooks/useCeoPicker";
import architectCard from "@/assets/images/choose-ceo-card/architect.png";
import baronCard from "@/assets/images/choose-ceo-card/baron.png";
import diplomatCard from "@/assets/images/choose-ceo-card/diplomat.png";
import explorerCard from "@/assets/images/choose-ceo-card/explorer.png";
import generalCard from "@/assets/images/choose-ceo-card/general.png";
import innovatorCard from "@/assets/images/choose-ceo-card/innovator.png";
import maverickCard from "@/assets/images/choose-ceo-card/maverick.png";
import oracleCard from "@/assets/images/choose-ceo-card/oracle.png";
import phoenixCard from "@/assets/images/choose-ceo-card/phoenix.png";
import shadowCard from "@/assets/images/choose-ceo-card/shadow.png";
import showmanCard from "@/assets/images/choose-ceo-card/showman.png";
import tycoonCard from "@/assets/images/choose-ceo-card/tycoon.png";

const CEO_CARDS: Record<string, string> = {
  architect: architectCard,
  baron: baronCard,
  diplomat: diplomatCard,
  explorer: explorerCard,
  general: generalCard,
  innovator: innovatorCard,
  maverick: maverickCard,
  oracle: oracleCard,
  phoenix: phoenixCard,
  shadow: shadowCard,
  showman: showmanCard,
  tycoon: tycoonCard,
  visionary: innovatorCard,
};

export const ceoCardFor = (title: string) => CEO_CARDS[normalizeCharacterTitle(title)] ?? baronCard;

interface CeoCarouselProps {
  archetypes: CeoArchetype[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CeoCarousel = ({ archetypes, selectedId, onSelect }: CeoCarouselProps) => {
  return (
    <div className="scrollbar-hidden flex w-full justify-center snap-x snap-mandatory gap-3 overflow-x-auto px-8 py-2">
      {archetypes.map((hero) => {
        const isSelected = hero.id === selectedId;
        const assets = studentCeoAssets(hero.title);
        const card = ceoCardFor(hero.title);

        return (
          <button
            key={hero.id}
            type="button"
            onClick={() => onSelect(hero.id)}
            aria-label={`Select ${hero.title}`}
            aria-pressed={isSelected}
            className={`relative h-[226px] w-[112px] shrink-0 snap-start overflow-hidden bg-black/60 transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isSelected ? "z-10" : ""
            }`}
            style={
              isSelected
                ? {
                    boxShadow: `0 0 0 2px ${assets.color}, 0 0 6px 3px ${assets.color}, 0 0 16px 10px ${assets.color}99`,
                  }
                : undefined
            }
          >
              <img src={card} alt="" className="h-full w-full object-fill" />
          </button>
        );
      })}
    </div>
  );
};

export { CeoCarousel };
