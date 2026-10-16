import shadowBg from "@/assets/images/shadow-bg.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

// Sourced from Figma file XgV5NDxYCxMayIkC4pO1qA, frame "CEO SHOWMAN" (node
// 1:710 — the frame is mislabeled in Figma; its live text reads "SHADOW").
// See tycoon.ts for why the stylized-text/divider/progress-art fields are
// intentionally left unset.
//
// TODO: levelBadgeAsset and both perk icons are TEMPORARY placeholders —
// the Figma MCP export hit the Starter-plan rate limit before these three
// assets (badge node 1:782, perk nodes 1:792/1:793) could be downloaded.
// Re-run download_assets/get_screenshot on those node ids and swap in the
// real art once the limit resets.
export const SHADOW_THEME: HeroTheme = { id: "shadow", primary: "#7fa6ca" };

export const SHADOW_HERO_DATA: HeroSelectCardData = {
  theme: SHADOW_THEME,
  // archtypes.id for title "Shadow" in the live DB.
  archetypeId: "daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "The Shadow",
  namePrefixAsset: images.shadowThe,
  nameAsset: images.shadowTitle,

  subtitle: "The Unseen Eye",
  subtitleAsset: images.shadowCaption,
  description:
    "Silent, patient, and impossible to predict. By the time rivals notice the plan, it's already too late.",
  descriptionAsset: images.shadowSubtitle,

  level: 3,
  currentXP: 8,
  nextLevelXP: 10,

  progressBorderAsset: images.shadowButtonBorder,
  progressFillAsset: images.shadowButtonFill,
  // portraitAsset: undefined, // Portrait not available
  backgroundAsset: shadowBg,
  levelBadgeAsset: images.shadowBadge, // TEMPORARY placeholder

  ornateDividerAsset: images.shadowCrown,
  lineDividerAsset: images.shadowSeparator,

  tabs: heroTabs(),
  perks: [
    {
      id: "insider_trading",
      name: "Insider Trading",
      unlockLevel: 3,
      locked: true,
      icon: images.shadowPerk1Icon, // TEMPORARY placeholder
    },
    {
      id: "extortion",
      name: "Extortion",
      unlockLevel: 5,
      locked: true,
      icon: images.shadowPerk2Icon, // TEMPORARY placeholder
    },
  ],
};
