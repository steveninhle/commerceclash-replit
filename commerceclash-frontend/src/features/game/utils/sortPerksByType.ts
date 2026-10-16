import type { Perk } from "../hooks/heroCard/types";

const PERK_TYPE_ORDER = { CORE: 0, ULTRA: 1 } as const;

// CORE perks first, then ULTRA, then anything unrecognized.
export const sortPerksByType = (perks: Perk[]): Perk[] =>
  perks.slice().sort((a, b) => {
    const aType = a.perk_type?.toUpperCase() as keyof typeof PERK_TYPE_ORDER;
    const bType = b.perk_type?.toUpperCase() as keyof typeof PERK_TYPE_ORDER;
    const aOrder = PERK_TYPE_ORDER[aType] ?? 2;
    const bOrder = PERK_TYPE_ORDER[bType] ?? 2;
    return aOrder - bOrder;
  });
