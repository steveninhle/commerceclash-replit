import showmanBg from "@/assets/images/showman-bg.png";
import showmanBadge from "@/assets/images/badge/showman-badge.svg";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

// Sourced from Figma file XgV5NDxYCxMayIkC4pO1qA, frame "CEO SHOWMAN" (node
// 1:455). See tycoon.ts for why the stylized-text/divider/progress-art
// fields are intentionally left unset.
export const SHOWMAN_THEME: HeroTheme = { id: "showman", primary: "#00f746" };

export const SHOWMAN_HERO_DATA: HeroSelectCardData = {
  theme: SHOWMAN_THEME,
  // archtypes.id for title "Showman" in the live DB.
  archetypeId: "d6666666-6666-6666-6666-666666666666",
  name: "The Showman",

  namePrefixAsset: images.showmanThe,
  nameAsset: images.showmanTitle,

  subtitle: "Unmatched Charisma",
  subtitleAsset: images.showmanCaption,

  description:
    "A natural-born entertainer with unmatched charisma and star power. People follow you and are drawn to your big personality.",
  descriptionAsset: images.showmanSubtitle,

  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.showmanButtonBorder,
  progressFillAsset: images.showmanButtonFill,
  // portraitAsset: showmanPortrait,

  backgroundAsset: showmanBg,
  levelBadgeAsset: showmanBadge,

  ornateDividerAsset: images.showmanCrown,
  lineDividerAsset: images.showmanSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "spotlight",
      name: "Spotlight",
      unlockLevel: 3,
      locked: true,
      icon: images.showmanPerk1Icon,
    },
    {
      id: "star_power",
      name: "Star Power",
      unlockLevel: 3,
      locked: true,
      icon: images.showmanPerk2Icon,
    },
  ],
};
