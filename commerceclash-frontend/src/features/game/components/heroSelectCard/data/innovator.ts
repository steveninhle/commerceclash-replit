import innovatorBg from "@/assets/images/innovator-bg.png";
import innovatorBadge from "@/assets/images/badge/innovator-badge.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const INNOVATOR_THEME: HeroTheme = {
  id: "innovator",
  primary: "#ffa4d0",
};

export const INNOVATOR_HERO_DATA: HeroSelectCardData = {
  theme: INNOVATOR_THEME,
  // archtypes.id for title "The Visionary" in the live DB.
  archetypeId: "7179c838-1fe7-47f1-ba81-9d0a001e3834",
  name: "The Visionary",
  namePrefixAsset: images.innovatorThe,
  nameAsset: images.innovatorTitle,

  subtitle: "WHERE IDEAS TAKE FLIGHT",
  // subtitleAsset intentionally omitted: images.innovatorCaption
  // (innovator-caption.svg) is a wrong/duplicate export — it has the
  // exact same 367×82 viewBox and filter id as innovator-title.svg (the
  // "INNOVATOR" title graphic), not the actual "WHERE IDEAS TAKE FLIGHT"
  // caption art. Omitting it falls back to live theme-colored text
  // (see HeroSelectCardSubtitle) using the string above instead of
  // rendering "INNOVATOR" a second time. Re-add once the correct SVG
  // is exported.
  description:
    "A brilliant mind driven by curiosity and a passion to solve the impossible. She turns bold ideas into real-world solutions that change everything.",
  descriptionAsset: images.innovatorSubtitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.innovatorButtonBorder,
  progressFillAsset: images.innovatorButtonFill,
  backgroundAsset: innovatorBg,
  levelBadgeAsset: innovatorBadge,
  ornateDividerAsset: images.innovatorCrown,
  lineDividerAsset: images.innovatorSeparator,
  tabs: heroTabs(),
  perks: [
    {
      id: "reimagine",
      name: "Reimagine",
      unlockLevel: 3,
      locked: true,
      icon: images.reimaginePerk,
    },
    {
      id: "eureka",
      name: "Eureka!",
      unlockLevel: 5,
      locked: true,
      icon: images.eurekaPerk,
    },
  ],
};
