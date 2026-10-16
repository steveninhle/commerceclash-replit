import { images } from "@/assets";
import type { HeroSelectCardData } from "./types";
import type { HeroTheme } from "./theme";
import { heroTabs } from "./heroTabs";
import baronBadge from "@/assets/images/badge/baron-badge.png";
import heroBg from "@/assets/images/hero-bg.png";



export const BARON_THEME: HeroTheme = { id: "baron", primary: "#ef4444" };

export const BARON_HERO_DATA: HeroSelectCardData = {
  theme: BARON_THEME,
  // archtypes.id for title "The Baron " in the live DB.
  archetypeId: "33c79b21-7224-40b5-8d13-d1a3b0b4a675",
  name: "The Baron",
  namePrefixAsset: images.baronThe,
  nameAsset: images.baronTitle,
  subtitle: "Tyrant of Wealth",
  subtitleAsset: images.baronCaption,
  description:
    "A cold strategic empire-builder operating above rules, loyalty, and ethics.",
  descriptionAsset: images.baronSubTitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.baronButtonBorder,
  progressFillAsset: images.baronButtonFill,
  // portraitAsset: images.baroon,

  backgroundAsset: heroBg,
  // foregroundAsset: images.baronChess,
  levelBadgeAsset: baronBadge,

  ornateDividerAsset: images.crownBaronV2,
  lineDividerAsset: images.baronSeparetor,
  tabs: heroTabs(),
  perks: [
    {
      id: "greed",
      name: "Greed",
      unlockLevel: 3,
      locked: true,
      icon: images.greedPerk,
      nameAsset: images.greedGradient,
    },
    {
      id: "oblivion",
      name: "Oblivion",
      unlockLevel: 5,
      locked: true,
      icon: images.oblivionPerk,
      nameAsset: images.oblivionGradient,
    },
  ],
};
