import phoenixBg from "@/assets/images/phoenix-bg.png";
import phoenixBadge from "@/assets/images/badge/phoenix-badge.svg";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const PHOENIX_THEME: HeroTheme = { id: "phoenix", primary: "#f96400" };

export const PHOENIX_HERO_DATA: HeroSelectCardData = {
  theme: PHOENIX_THEME,
  // archtypes.id for title "Phoenix" in the live DB.
  archetypeId: "d9999999-9999-9999-9999-999999999999",
  name: "The Phoenix",

  namePrefixAsset: images.phoenixThe,
  nameAsset: images.phoenixTitle,

  subtitle: "Risen from the Ashes",

  subtitleAsset: images.phoenixCaption,
  description:
    "A survivor, a fighter, a force of nature. No matter how hard she falls, she rises stronger, turning every setback into a soaring comeback.",
  descriptionAsset: images.phoenixSubtitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.phoenixButtonBorder,
  progressFillAsset: images.phoenixButtonFill,

  // portraitAsset: phoenixPortrait,

  backgroundAsset: phoenixBg,
  levelBadgeAsset: phoenixBadge,
  ornateDividerAsset: images.phoenixCrown,
  lineDividerAsset: images.phoenixSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "fan_the_flames",
      name: "Fan the Flames",
      unlockLevel: 3,
      locked: true,
      icon: images.phoenixPerk1Icon,
    },
    {
      id: "rebirth",
      name: "Rebirth",
      unlockLevel: 3,
      locked: true,
      icon: images.phoenixPerk2Icon,
    },
  ],
};
