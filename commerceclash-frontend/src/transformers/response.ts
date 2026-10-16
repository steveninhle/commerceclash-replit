import { ApiCharacterResponse, Character } from "./types";

export function transformCharacterResponse(
  response: ApiCharacterResponse,
): Character {
  return {
    id: response.id ?? "",
    title: response.title ?? "",
    subtitle: response.sub_title ?? "",
    xp: response.xp ?? 0,
    level: response.level ?? 1,
    perks: response.perks.map((perk) => ({
      id: perk.id,
      title: perk.title,
      description: perk.description ?? "",
      is_unlocked: perk.is_unlocked,
      used: perk.is_used,
      status: perk.perk_status,
      approved: perk.is_approved === true,
      key: perk.key,
      perk_type: perk.perk_type ?? undefined,
      is_repeatable: perk.is_repeatable,
      next_available_at: perk.next_available_at,
      last_used_at: perk.last_used_at,
      required_level: perk.required_level,
    })),
  };
}
