import explorerBg from "@/assets/images/explorer-bg.png";
import explorerBadge from "@/assets/images/badge/explorer-badge.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const EXPLORER_THEME: HeroTheme = { id: "explorer", primary: "#42bc00" };

export const EXPLORER_HERO_DATA: HeroSelectCardData = {
  theme: EXPLORER_THEME,
  // archtypes.id for title "The Explorer" in the live DB.
  archetypeId: "795e8157-2e32-4a7c-84c0-97d21cbb62e4",
  name: "The Explorer",
  namePrefixAsset: images.explorerThe,
  nameAsset: images.explorerTitle,

  subtitle: "EXPLORE. DISCOVER. GROW.",
  subtitleAsset: images.explorerCaption,
  description:
    "A fearless discoverer who ventures into the unknown to find opportunities others overlook. With sharp instincts and boundless curiously, she always finds a way.",
  descriptionAsset: images.explorerSubtitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.explorerButtonBorder,
  progressFillAsset: images.explorerButtonFill,
  backgroundAsset: explorerBg,
  levelBadgeAsset: explorerBadge,
  ornateDividerAsset: images.explorerCrown,
  lineDividerAsset: images.explorerSeparator,
  tabs: heroTabs(),
  perks: [
    {
      id: "espionage",
      name: "Espionage",
      unlockLevel: 3,
      locked: true,
      icon: images.espionagePerk,
    },
    {
      id: "trailblazer",
      name: "Trailblazer",
      unlockLevel: 5,
      locked: true,
      icon: images.trailblazerPerk,
    },
  ],
};
