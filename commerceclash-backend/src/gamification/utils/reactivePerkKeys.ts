export const REACTIVE_ONLY_PERK_KEYS = [
  'spotlight',
  'star_power',
  'prophecy',
  'crystal_ball',
  'masterpiece',
  'rebirth',
  'insider_trading',
  'extortion',
] as const;

export function isReactiveOnlyPerkKey(key: string): boolean {
  return (REACTIVE_ONLY_PERK_KEYS as readonly string[]).includes(key);
}

export const NEW_PERK_KEYS = [
  ...REACTIVE_ONLY_PERK_KEYS,
  'afterburner',
  'danger_zone',
  'blueprint',
  'fan_the_flames',
] as const;
export function isNewPerkKey(key: string): boolean {
  return (NEW_PERK_KEYS as readonly string[]).includes(key);
}
export function waitsForPerkTrigger(key: string): boolean {
  return isReactiveOnlyPerkKey(key) || key === 'fan_the_flames';
}
export function requiredPerkLevel(type: string): number {
  return type.toLowerCase() === 'ultra' ? 5 : 3;
}
