import maverickBg from "@/assets/images/maverick-bg.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";
import { maverickBadge } from "@/assets/images";

export const MAVERICK_THEME: HeroTheme = { id: "maverick", primary: "#ff8e41" };

export const MAVERICK_HERO_DATA: HeroSelectCardData = {
  theme: MAVERICK_THEME,
  archetypeId: "d5555555-5555-5555-5555-555555555555",
  name: "The Maverick",

  namePrefixAsset: images.maverickThe,
  nameAsset: images.maverickTitle,

  subtitle: "Full throttle",
  description:
    "He moves fast, takes risks, and somehow lands on his feet.While others wait for permission, he's already airborne",
  descriptionAsset: images.maverickSubtitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.maverickButtonBorder,
  progressFillAsset: images.maverickButtonFill,
  // portraitAsset: maverickPortrait,
  backgroundAsset: maverickBg,
  levelBadgeAsset: maverickBadge,

  ornateDividerAsset: images.maverickCrown,
  lineDividerAsset: images.maverickSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "afterburner",
      name: "Afterburner",
      unlockLevel: 3,
      locked: true,
      icon: images.maverickPerk1Icon,
    },
    {
      id: "danger-zone",
      name: "Danger Zone",
      unlockLevel: 3,
      locked: true,
      icon: images.maverickPerk2Icon,
    },
  ],
};
