import type { HeroTheme } from "./theme";

export type HeroSelectCardTab = {
  id: string;
  label: string;

  icon: string;
  iconOverlay?: string;

  activeColor: string;
  active?: boolean;
  disabled?: boolean;
};

export type HeroSelectCardPerk = {
  id: string;
  name: string;
  unlockLevel: number;
  locked: boolean;
  icon: string;

  nameAsset?: string;
};

export type HeroSelectCardData = {
  theme: HeroTheme;
  /** Real `archtypes.id` (UUID) from the backend DB — required by the
   * assign-ceo endpoint's `ceoId` field. Not the same as `theme.id`, which
   * is just a local display/theming slug. */
  archetypeId?: string;
  name: string;
  namePrefixAsset?: string;

  nameAsset?: string;
  subtitle: string;
  subtitleAsset?: string;
  description: string;

  descriptionAsset?: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progressBorderAsset?: string;
  progressFillAsset?: string;
  portraitAsset?: string;
  backgroundAsset: string;
  foregroundAsset?: string;
  levelBadgeAsset: string;
  levelNumberAsset?: string;
  ornateDividerAsset?: string;
  lineDividerAsset?: string;
  tabs: HeroSelectCardTab[];
  perks: HeroSelectCardPerk[];
};
