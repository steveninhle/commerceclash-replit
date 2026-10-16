import generalBg from "@/assets/images/general-bg.png";
import generalBadge from "@/assets/images/badge/general-badge.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const GENERAL_THEME: HeroTheme = { id: "general", primary: "#082dff" };

export const GENERAL_HERO_DATA: HeroSelectCardData = {
  theme: GENERAL_THEME,
  // archtypes.id for title "The General" in the live DB.
  archetypeId: "5c363a3b-ed7b-4a5c-bcf8-c2dcabdf33a4",
  name: "The General",
  namePrefixAsset: images.generalThe,
  nameAsset: images.generalTitle,

  subtitle: "LEAD. INSPIRE. WIN.",
  subtitleAsset: images.generalCaption,
  description:
    "A true leader who rallies teams, defines strategy, and turns pressure into momentum. He leads with clarity, confidence, and the ability to inspire others to follow his vision.",
  descriptionAsset: images.generalSubtitle,

  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.generalButtonBorder,
  progressFillAsset: images.generalButtonFill,
  backgroundAsset: generalBg,
  levelBadgeAsset: generalBadge,
  ornateDividerAsset: images.generalCrown,
  lineDividerAsset: images.generalSeparator,
  tabs: heroTabs(),
  perks: [
    {
      id: "rallying-cry",
      name: "Rallying Cry",
      unlockLevel: 3,
      locked: true,
      icon: images.rallyingCryPerk,
    },
    {
      id: "judgement",
      name: "Judgement",
      unlockLevel: 5,
      locked: true,
      icon: images.judgementPerk,
    },
  ],
};
