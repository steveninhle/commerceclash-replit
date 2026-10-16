import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";
import oracleBg from "@/assets/images/oracle-bg.png";

// Oracle's stylized name/title/subtitle/divider/progress-bar art hasn't been
// exported from Figma yet. See tycoon.ts / architect.ts for why those fields
// are intentionally left unset — HeroSelectCard falls back to themed live
// text/CSS for all of them.
export const ORACLE_THEME: HeroTheme = { id: "oracle", primary: "#4bfff3" };

export const ORACLE_HERO_DATA: HeroSelectCardData = {
  theme: ORACLE_THEME,
  archetypeId: "d7777777-7777-7777-7777-777777777777",
  name: "The Oracle",

  namePrefixAsset: images.oracleThe,
  nameAsset: images.oracleTitle,

  subtitle: "The All-Seeing Eye",
  description:
    "A natural-born entertainer with unmatched charisma and star power. People follow you and are drawn to your big personality.",
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.oracleButtonBorder,
  progressFillAsset: images.oracleButtonFill,
  // portraitAsset: oraclePortrait,

  backgroundAsset: oracleBg,
  levelBadgeAsset: images.oracleBadge,

  ornateDividerAsset: images.oracleCrown,
  lineDividerAsset: images.oracleSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "prophecy",
      name: "Prophecy",
      unlockLevel: 3,
      locked: true,
      icon: images.oraclePerk1Icon,
    },
    {
      id: "crystal_ball",
      name: "Crystal Ball",
      unlockLevel: 3,
      locked: true,
      icon: images.oraclePerk2Icon,
    },
  ],
};
