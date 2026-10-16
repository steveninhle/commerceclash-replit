import { Sparkles } from "lucide-react";
import { images } from "@/assets";
import { HERO_GALLERY_DATA } from "@/features/game/components/heroSelectCard/heroesData";
import type { CeoArchetype } from "./hooks/useCeoPicker";
import { normalizeCharacterTitle, studentCeoAssets } from "@/utils/helper";
import architectPerk1 from "@/assets/images/architect-perk1-icon.png";
import architectPerk2 from "@/assets/images/architect-perk2-icon.png";
import diplomatPerk1 from "@/assets/images/diplomat-perk1-icon.png";
import diplomatPerk2 from "@/assets/images/diplomat-perk2-icon.png";
import explorerPerk1 from "@/assets/images/explorer-perk1-icon.png";
import explorerPerk2 from "@/assets/images/explorer-perk2-icon.png";
import generalPerk1 from "@/assets/images/general-perk1-icon.png";
import generalPerk2 from "@/assets/images/general-perk2-icon.png";
import innovatorPerk1 from "@/assets/images/innovator-perk1-icon.png";
import innovatorPerk2 from "@/assets/images/innovator-perk2-icon.png";
import maverickPerk1 from "@/assets/images/maverick-perk1-icon.png";
import maverickPerk2 from "@/assets/images/maverick-perk2-icon.png";
import oraclePerk1 from "@/assets/images/oracle-perk1-icon.png";
import oraclePerk2 from "@/assets/images/oracle-perk2-icon.png";
import phoenixPerk1 from "@/assets/images/phoenix-perk1-icon.png";
import phoenixPerk2 from "@/assets/images/phoenix-perk2-icon.png";
import shadowPerk1 from "@/assets/images/shadow-perk1-icon.png";
import shadowPerk2 from "@/assets/images/shadow-perk2-icon.png";
import showmanPerk1 from "@/assets/images/showman-perk1-icon.png";
import showmanPerk2 from "@/assets/images/showman-perk2-icon.png";
import tycoonPerk1 from "@/assets/images/tycoon-perk1-icon.png";
import tycoonPerk2 from "@/assets/images/tycoon-perk2-icon.png";

const PERK_ICONS: Record<string, [string, string]> = {
  architect: [architectPerk1, architectPerk2],
  baron: [images.greedPerk, images.oblivionPerk],
  diplomat: [diplomatPerk1, diplomatPerk2],
  explorer: [explorerPerk1, explorerPerk2],
  general: [generalPerk1, generalPerk2],
  innovator: [innovatorPerk1, innovatorPerk2],
  maverick: [maverickPerk1, maverickPerk2],
  oracle: [oraclePerk1, oraclePerk2],
  phoenix: [phoenixPerk1, phoenixPerk2],
  shadow: [shadowPerk1, shadowPerk2],
  showman: [showmanPerk1, showmanPerk2],
  tycoon: [tycoonPerk1, tycoonPerk2],
  visionary: [innovatorPerk1, innovatorPerk2],
};

const normalizePerkTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, "");

const perkIconIndexFor = (heroTitle: string, perkTitle: string, fallbackIndex: number) => {
  const galleryTitle = heroTitle === "innovator" ? "visionary" : heroTitle;
  const galleryHero = HERO_GALLERY_DATA.find(
    (hero) => normalizeCharacterTitle(hero.name) === galleryTitle,
  );
  const matchingIndex = galleryHero?.perks.findIndex(
    (perk) => normalizePerkTitle(perk.name) === normalizePerkTitle(perkTitle),
  );
  return matchingIndex !== undefined && matchingIndex >= 0 ? matchingIndex : fallbackIndex;
};

interface StrengthConfig {
  label: string;
  icon: string;
  filled: number;
  from: string;
  to: string;
}

const STRENGTHS: StrengthConfig[] = [
  {
    label: "STRATEGIC",
    icon: images.strategic,
    filled: 4,
    from: "#7C3AED",
    to: "#C084FC",
  },
  {
    label: "SOCIAL",
    icon: images.social,
    filled: 5,
    from: "#2563EB",
    to: "#60A5FA",
  },
  {
    label: "BOLD",
    icon: images.bold,
    filled: 5,
    from: "#16A34A",
    to: "#4ADE80",
  },
];

interface LeadershipStrengthsProps {
  hero?: CeoArchetype;
  isLoading?: boolean;
}

const LeadershipStrengths = ({ hero, isLoading = false }: LeadershipStrengthsProps) => {
  const assets = studentCeoAssets(hero?.title);
  const heroTitle = normalizeCharacterTitle(hero?.title);
  const perkIcons = PERK_ICONS[heroTitle];

  return (
    <div className="flex w-full max-w-sm flex-col gap-y-6 rounded-2xl border border-[#B99033]/60 bg-black p-4 backdrop-blur-sm xl:h-full xl:min-h-0 xl:w-[24%] xl:max-w-none xl:shrink-0 xl:gap-y-3 xl:p-3 2xl:gap-y-5 2xl:p-4">
      <div className="mb-3 flex items-center justify-center xl:mb-0">
        <div className="text-2xl font-extrabold tracking-wide label-text-choose-ceo xl:text-lg 2xl:text-2xl">
          LEADERSHIP STRENGTHS
        </div>
      </div>
      <div className="flex w-[40%] items-center justify-center mx-auto mb-2 xl:mb-0">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#997C3B] to-[#FFCF62] shadow-[3px_0px_15.3px_23px_#00000024]" />
        <div className="relative mx-2 flex h-3 w-3 items-center justify-center">
          <div className="absolute h-[4px] w-[4px] rotate-45 rounded-[1px] bg-[#FFCF62] shadow-[0_0_6px_#FFCF62] " />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#FFCF62] via-[#997C3B] to-transparentshadow-[3px_0px_15.3px_23px_#00000024]" />
      </div>
      <div className="flex flex-col gap-4 px-2 xl:gap-1 xl:px-0 2xl:gap-2">
        {STRENGTHS.map((strength) => (
          <div key={strength.label} className="flex gap-4 justify-between xl:gap-2">
            <div className="flex gap-x-4 xl:gap-x-2">
              <img src={strength.icon} alt={strength.label} className="xl:h-4 xl:w-4 2xl:h-6 2xl:w-6" />
              <div className="text-xl text-white font-medium xl:text-sm 2xl:text-xl">
                {strength.label}
              </div>
            </div>
            <div className="flex gap-1 xl:gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-6 skew-x-[-20deg] rounded-[2px] xl:h-4 xl:w-4 2xl:h-6 2xl:w-6"
                  style={
                    i < strength.filled
                      ? {
                          background: `linear-gradient(180deg, ${strength.from}, ${strength.to})`,
                          boxShadow: `0 0 8px ${strength.from}aa`,
                        }
                      : { backgroundColor: "#1f2937" }
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex w-2/3 items-center justify-center mx-auto mb-2 xl:mb-0">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#997C3B] to-[#FFCF62] shadow-[3px_0px_15.3px_23px_#00000024]" />
        <div className="relative mx-2 flex h-3 w-3 items-center justify-center">
          <div className="absolute h-[6px] w-[6px] rotate-45 rounded-[1px] bg-[#FFCF62] shadow-[0_0_6px_#FFCF62] " />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#FFCF62] via-[#997C3B] to-transparentshadow-[3px_0px_15.3px_23px_#00000024]" />
      </div>
      <div className="text-2xl font-extrabold tracking-wide label-text-choose-ceo xl:text-lg 2xl:text-2xl">
        PERKS
      </div>
      <div className="flex flex-col gap-4 xl:gap-2 2xl:gap-4">
        {isLoading ? (
          <>
            <PerkSkeleton />
            <PerkSkeleton />
          </>
        ) : hero?.perks.length ? (
          hero.perks.map((perk, index) => {
            const iconIndex = perkIconIndexFor(heroTitle, perk.title, index);
            const perkIcon = perkIcons?.[iconIndex];
            return (
              <div
                key={perk.id}
                className="flex gap-x-3 rounded-lg border p-2 xl:gap-x-2 xl:p-2 2xl:gap-x-3 2xl:p-2"
                style={{ borderColor: `${assets.color}80` }}
              >
                {perkIcon ? (
                  heroTitle === "general" ? (
                    <span
                      className="h-20 w-20 shrink-0 bg-no-repeat xl:h-16 xl:w-16 2xl:h-20 2xl:w-20"
                      style={{
                        backgroundImage: `url(${perkIcon})`,
                        backgroundSize: "200% auto",
                        backgroundPosition: iconIndex === 0 ? "left center" : "right center",
                      }}
                      aria-hidden="true"
                    />
                  ) : (
                    <img
                      src={perkIcon}
                      alt=""
                      className={`h-20 shrink-0 object-contain xl:h-16 2xl:h-20 ${
                        heroTitle === "visionary" || heroTitle === "innovator" || heroTitle === "explorer"
                          ? "w-24 xl:w-[72px] 2xl:w-24"
                          : "w-20 xl:w-16 2xl:w-20"
                      }`}
                    />
                  )
                ) : (
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg xl:h-16 xl:w-16 2xl:h-20 2xl:w-20"
                    style={{ backgroundColor: `${assets.color}24`, color: assets.color }}
                  >
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col items-start gap-y-1 text-start">
                  <div className="w-full text-lg font-black xl:text-sm 2xl:text-lg" style={{ color: assets.color }}>
                    {perk.title.toUpperCase()}
                  </div>
                  <div className="text-start text-sm text-[#B9B9B9] xl:text-xs xl:leading-4 2xl:text-sm 2xl:leading-5">
                    {perk.description || "No description available."}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-gray-600 p-3 text-sm text-[#B9B9B9]">
            No perks are available for this CEO yet.
          </div>
        )}
      </div>
    </div>
  );
};

const PerkSkeleton = () => (
  <div className="flex animate-pulse gap-x-3 rounded-lg border border-gray-700 p-3">
    <div className="h-12 w-12 rounded-lg bg-white/10" />
    <div className="flex flex-1 flex-col gap-2 py-1">
      <div className="h-4 w-1/3 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/10" />
      <div className="h-3 w-2/3 rounded bg-white/10" />
    </div>
  </div>
);

export default LeadershipStrengths;
