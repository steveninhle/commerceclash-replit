export type PerkActionVariant =
  | "locked"
  | "used"
  | "requesting"
  | "pending"
  | "approved"
  | "activate";

export interface PerkActionState {
  label: string;
  upperLabel: string;
  disabled: boolean;
  clickable: boolean;
  variant: PerkActionVariant;
}

// Match gamification/utils/reactivePerkKeys.ts. A teacher unlock alone does
// not bypass the enrollment level check for these perks.
const NEW_PERK_KEYS = new Set([
  "spotlight", "star_power", "prophecy", "crystal_ball", "masterpiece",
  "rebirth", "insider_trading", "extortion", "afterburner", "danger_zone",
  "blueprint", "fan_the_flames",
]);

export function requiredPerkLevel(type?: string | null): number {
  return type?.toLowerCase() === "ultra" ? 5 : 3;
}

export function isPerkAvailableAtLevel(
  perk: { key?: string; perk_type?: string; is_unlocked: boolean },
  level: number | null | undefined,
): boolean {
  return perk.is_unlocked &&
    (!NEW_PERK_KEYS.has(perk.key ?? "") ||
      (level ?? 1) >= requiredPerkLevel(perk.perk_type));
}

/**
 * Standardized status resolver for all perk activation buttons across
 * Hero HUD cards, live gallery items, and preview modals.
 */
export function resolvePerkActionState(
  unlocked: boolean,
  isUsed: boolean,
  perkStatus?: string | null,
): PerkActionState {
  if (!unlocked) {
    return {
      label: "Locked",
      upperLabel: "LOCKED",
      disabled: true,
      clickable: false,
      variant: "locked",
    };
  }

  if (isUsed) {
    return {
      label: "Used",
      upperLabel: "USED",
      disabled: true,
      clickable: false,
      variant: "used",
    };
  }

  if (perkStatus === "requesting") {
    return { label: "Requesting", upperLabel: "REQUESTING", disabled: true, clickable: false, variant: "requesting" };
  }

  if (perkStatus === "pending") {
    return {
      label: "Requested",
      upperLabel: "REQUESTED",
      disabled: true,
      clickable: false,
      variant: "pending",
    };
  }

  if (perkStatus === "approved") {
    return {
      label: "Approved",
      upperLabel: "APPROVED",
      disabled: true,
      clickable: false,
      variant: "approved",
    };
  }

  return {
    label: "Activate",
    upperLabel: "ACTIVATE",
    disabled: false,
    clickable: true,
    variant: "activate",
  };
}
