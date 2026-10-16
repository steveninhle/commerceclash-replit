import tycoonBg from "@/assets/images/tycoon-bg.png";
import tycoonBadge from "@/assets/images/badge/tycoon-badge.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

// Sourced from Figma file XgV5NDxYCxMayIkC4pO1qA, frame "CEO TYCOON" (node
// 1:368). name/subtitle/description are live text in that frame (no
// stylized title/caption graphics like Baron's), so namePrefixAsset,
// nameAsset, subtitleAsset, descriptionAsset, the progress-bar art, and the
// ornate/line dividers are intentionally left unset — HeroSelectCard falls
// back to themed live text/CSS for all of them.
export const TYCOON_THEME: HeroTheme = { id: "tycoon", primary: "#ffcc56" };

export const TYCOON_HERO_DATA: HeroSelectCardData = {
  theme: TYCOON_THEME,
  // archtypes.id for title "The Tycoon" in the live DB.
  archetypeId: "aa379b1f-e646-4c49-bd68-17242ddcb385",
  name: "The Tycoon",
  namePrefixAsset: images.tycoonThe,
  nameAsset: images.tycoonTitle,
  subtitle: "WEALTH NEVER SLEEPS",
  subtitleAsset: images.tycoonCaption,
  description:
    "An elite business titan obsessed with growth, control, and long-term dominance.To The Tycoon, every company is either a partner, a target, or a future acquisition.",
  descriptionAsset: images.tycoonSubtitle,

  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.tycoonButtonBorder,
  progressFillAsset: images.tycoonButtonFill,

  backgroundAsset: tycoonBg,
  levelBadgeAsset: tycoonBadge,

  ornateDividerAsset: images.tycoonCrown,
  lineDividerAsset: images.tycoonSeparetor,

  tabs: heroTabs(),
  perks: [
    {
      id: "surge",
      name: "Surge",
      unlockLevel: 3,
      locked: true,
      icon: images.tycoonPerk1Icon,
    },
    {
      id: "monopoly",
      name: "Monopoly",
      unlockLevel: 5,
      locked: true,
      icon: images.tycoonPerk2Icon,
    },
  ],
};
