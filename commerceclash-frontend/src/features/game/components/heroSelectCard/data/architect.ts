import architectBg from "@/assets/images/architect-bg.png";
import architectBadge from "@/assets/images/badge/architect-badge.svg";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const ARCHITECT_THEME: HeroTheme = {
  id: "architect",
  primary: "#dfb7ff",
};

export const ARCHITECT_HERO_DATA: HeroSelectCardData = {
  theme: ARCHITECT_THEME,
  // archtypes.id for title "Architect" in the live DB.
  archetypeId: "d8888888-8888-8888-8888-888888888888",
  name: "The Architect",

  namePrefixAsset: images.architectThe,
  nameAsset: images.architectTitle,

  subtitle: "Let it grow",
  subtitleAsset: images.architectCaption,
  description:
    "Calm, precise, and endlessly creative, she turns imagination into reality. What begins as a simple idea soon becomes something extraordinary.",
  descriptionAsset: images.architectSubtitle,

  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.architectButtonBorder,
  progressFillAsset: images.architectButtonFill,
  // portraitAsset: architectPortrait,
  backgroundAsset: architectBg,
  levelBadgeAsset: architectBadge,

  ornateDividerAsset: images.architectCrown,
  lineDividerAsset: images.architectSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "blueprint",
      name: "Blueprint",
      unlockLevel: 3,
      locked: true,
      icon: images.architectPerk1Icon,
    },
    {
      id: "masterpiece",
      name: "Masterpiece",
      unlockLevel: 3,
      locked: true,
      icon: images.architectPerk2Icon,
    },
  ],
};
