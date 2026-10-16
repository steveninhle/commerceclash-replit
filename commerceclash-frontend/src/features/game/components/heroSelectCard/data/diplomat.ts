import diplomatBg from "@/assets/images/diplomat-bg.png";
import diplomatBadge from "@/assets/images/badge/diplomat-badge.png";
import { heroTabs } from "../heroTabs";
import type { HeroSelectCardData } from "../types";
import type { HeroTheme } from "../theme";
import { images } from "@/assets";

export const DIPLOMAT_THEME: HeroTheme = { id: "diplomat", primary: "#b200ff" };

// lineDividerAsset is intentionally omitted: the source Figma node
// previously flagged for it (15:121) turned out to be a chessboard/table
// image (a foreground-style asset, not a line ornament) once verified
// against the design. The actual small "line + diamond" glyph under the
// description (node 15:135) and under each perk's "unlocks at" row
// (15:169 / 15:183) is a themed vector ornament that visually matches
// HeroSelectCardDivider's generic CSS fallback exactly, so it's left
// unset here and rendered live via --hs-primary.
export const DIPLOMAT_HERO_DATA: HeroSelectCardData = {
  theme: DIPLOMAT_THEME,
  // archtypes.id for title "Diplomat" in the live DB.
  archetypeId: "de3c2013-244c-40d8-8a46-728621cb147a",
  name: "The Diplomat",
  namePrefixAsset: images.diplomatThe,
  nameAsset: images.diplomatTitle,

  subtitle: "Master of Influence",
  subtitleAsset: images.diplomatCaption,
  description:
    "A master communicator who shapes outcomes through charm, persuasion, and strategic influence. She controls the room long before anyone even realizes what happened.",
  descriptionAsset: images.diplomatSubtitle,
  level: 3,
  currentXP: 8,
  nextLevelXP: 10,
  progressBorderAsset: images.diplomatButtonBorder,
  progressFillAsset: images.diplomatButtonFill,
  // portraitAsset: diplomatPortrait,
  backgroundAsset: diplomatBg,
  levelBadgeAsset: diplomatBadge,
  ornateDividerAsset: images.diplomatCrown,
  lineDividerAsset: images.diplomatSeparator,
  tabs: heroTabs(),
  perks: [
    {
      id: "sabotage",
      name: "Sabotage",
      unlockLevel: 3,
      locked: true,
      icon: images.sabotagePerk,
    },
    {
      id: "robinhood",
      name: "Robinhood",
      unlockLevel: 5,
      locked: true,
      icon: images.robinhoodPerk,
    },
  ],
};
