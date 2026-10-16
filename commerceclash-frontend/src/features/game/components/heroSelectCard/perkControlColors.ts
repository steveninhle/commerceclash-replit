export type PerkControlColorTokens = {
  /** Raw CSS color for `style.borderColor` — see the note below on why this isn't a Tailwind class. */
  border: string;
  /** Raw CSS color for the `--tw-gradient-from` custom property (used with the static `bg-gradient-to-b`/`to-black` utilities). */
  from: string;
  /** Raw CSS color for the `--tw-ring-color` custom property (used with the static `focus-visible:ring-2` utility). */
  ring: string;
  /** Raw CSS `background-image` value for `style.backgroundImage`. */
  gradient: string;
  /** Raw CSS `border-image` value for `style.borderImage`. */
  borderImage: string;
  /** Raw [r, g, b] behind every token above — for consumers that need to build their own CSS from the same theme color instead of hardcoding a new one. */
  rgb: [number, number, number];
  /** Raw hex behind every token above — see `rgb`. */
  hex: string;
};

// Single source of truth per hero theme — every token below is derived from
// this one color, so nothing can drift out of sync with the border again
// (as `diplomat`/`innovator` previously did).
//
// IMPORTANT: these are raw CSS values, not Tailwind classes. Tailwind can
// only generate a utility for a class name that appears as one complete,
// literal string in the source — building `bg-[linear-gradient(...)]!` by
// interpolating `${r},${g},${b}` into a template literal (and/or splitting
// it across a `+` concatenation) means the literal text Tailwind's scanner
// sees is fragments like `` `bg-[linear-gradient(...,rgba(` `` broken by
// `${` — never one valid candidate. So it silently compiles NO CSS at all
// for any of these, for every hero, regardless of the actual color/opacity
// values chosen. Applying them as raw values via `style` (or via Tailwind's
// own CSS custom properties like `--tw-ring-color`/`--tw-gradient-from`,
// read by the *static*, non-dynamic `focus-visible:ring-2`/`bg-gradient-to-b`
// classes) sidesteps that scanning requirement entirely.
const PERK_THEME_COLOR: Record<
  string,
  { rgb: [number, number, number]; hex: string }
> = {
  baron: { rgb: [80, 0, 0], hex: "#500000" },
  diplomat: { rgb: [126, 59, 91], hex: "#7E3B5B" },
  explorer: { rgb: [35, 78, 12], hex: "#234E0C" },
  general: { rgb: [8, 45, 255], hex: "#082DFF" },
  innovator: { rgb: [68, 0, 80], hex: "#440050" },
  tycoon: { rgb: [255, 204, 86], hex: "#FFCC56" },
  showman: { rgb: [0, 247, 70], hex: "#00F746" },
  phoenix: { rgb: [249, 100, 0], hex: "#F96400" },
  oracle: { rgb: [75, 255, 243], hex: "#4BFFF3" },
  architect: { rgb: [223, 183, 255], hex: "#DFB7FF" },
  maverick: { rgb: [255, 142, 65], hex: "#FF8E41" },
  shadow: { rgb: [127, 166, 202], hex: "#7FA6CA" },
};

const buildControlColors = (
  rgb: [number, number, number],
  hex: string,
): PerkControlColorTokens => {
  const [r, g, b] = rgb;
  return {
    // Figma specs for baron/diplomat/explorer/general all show the border
    // at full opacity, not the 0.45 this used to be.
    border: `rgba(${r},${g},${b},1)`,
    from: hex,
    ring: hex,
    gradient:
      `linear-gradient(180deg,rgba(${r},${g},${b},0.81) 0%,rgba(12,0,0,0.97) 17%,` +
      `rgba(0,0,0,1) 88%,rgba(${r},${g},${b},1) 100%)`,
    borderImage: `linear-gradient(90deg,${hex}66 0%,#0C0000 70%) 1`,
    rgb,
    hex,
  };
};

export const PERK_CONTROL_COLORS: Record<string, PerkControlColorTokens> =
  Object.fromEntries(
    Object.entries(PERK_THEME_COLOR).map(([themeId, { rgb, hex }]) => [
      themeId,
      buildControlColors(rgb, hex),
    ]),
  );

// Phoenix's background gradient is pinned to the exact Figma spec (0% stop
// at 57% opacity) instead of the shared 81% every other theme uses above.
PERK_CONTROL_COLORS.phoenix = {
  ...PERK_CONTROL_COLORS.phoenix,
  gradient:
    "linear-gradient(180deg,rgba(249,100,0,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(249,100,0,1) 100%)",
};

// Innovator's background gradient is pinned to its exact Figma spec
// (color #7E3B5B / rgb(126,59,91) at 0% and 100%, both at full opacity)
// instead of the shared formula's rgb(68,0,80) derived from PERK_THEME_COLOR.
// Innovator's border is a distinct bright magenta per Figma —
// hsba(331,69%,100%,1) converts to rgb(255,79,164), unlike the gradient's
// rgb(126,59,91).
PERK_CONTROL_COLORS.innovator = {
  ...PERK_CONTROL_COLORS.innovator,
  border: "rgba(255,79,164,1)",
  gradient:
    "linear-gradient(180deg,rgba(126,59,91,0.81) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(126,59,91,1) 100%)",
};

// Tycoon's background gradient is pinned to its exact Figma spec (color
// #9A7623 / rgb(154,118,35) at 0% [57% opacity] and 100% [full opacity])
// instead of the shared formula's rgb(255,204,86) derived from
// PERK_THEME_COLOR.
PERK_CONTROL_COLORS.tycoon = {
  ...PERK_CONTROL_COLORS.tycoon,
  gradient:
    "linear-gradient(180deg,rgba(154,118,35,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(154,118,35,1) 100%)",
};

// Showman's background gradient is pinned to its exact Figma spec (color
// #339A23 / rgb(51,154,35) at 0% [57% opacity] and 100% [full opacity])
// instead of the shared formula's rgb(0,247,70) derived from
// PERK_THEME_COLOR.
PERK_CONTROL_COLORS.showman = {
  ...PERK_CONTROL_COLORS.showman,
  gradient:
    "linear-gradient(180deg,rgba(51,154,35,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(51,154,35,1) 100%)",
};

// Oracle's background gradient is pinned to its exact Figma spec (color
// #048980 / rgb(4,137,128) at 0% and 100%, both at 81% opacity — matching
// the shared formula's opacity, just a different color) instead of the
// rgb(75,255,243) derived from PERK_THEME_COLOR.
PERK_CONTROL_COLORS.oracle = {
  ...PERK_CONTROL_COLORS.oracle,
  gradient:
    "linear-gradient(180deg,rgba(4,137,128,0.81) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(4,137,128,1) 100%)",
};

// Baron's border color is pinned to its exact Figma spec — hsba(0,80%,29%,1)
// converts to rgb(74,15,15) at full opacity, not the shared formula's
// rgb(80,0,0) at 0.45 alpha.
PERK_CONTROL_COLORS.baron = {
  ...PERK_CONTROL_COLORS.baron,
  border: "rgba(74,15,15,1)",
};

// Diplomat's background gradient is asymmetric per Figma — #330050
// rgb(51,0,80) at 0% and a different color, #440050 rgb(68,0,80), at 100%
// (both 81%/100% opacity) — unlike every other theme, which uses the same
// color at both ends. This can't come from the shared single-color formula.
// Diplomat's border is its own distinct color per Figma — hsba(282,79%,40%,1)
// converts to rgb(78,21,102), which matches neither of the gradient's two
// endpoint colors.
PERK_CONTROL_COLORS.diplomat = {
  ...PERK_CONTROL_COLORS.diplomat,
  border: "rgba(78,21,102,1)",
  gradient:
    "linear-gradient(180deg,rgba(51,0,80,0.81) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(68,0,80,1) 100%)",
};

// Architect's background gradient is pinned to its exact Figma spec (color
// #A37CC2 / rgb(163,124,194) at 0% [57% opacity] and 100% [full opacity])
// instead of the shared formula's rgb(223,183,255) derived from
// PERK_THEME_COLOR.
PERK_CONTROL_COLORS.architect = {
  ...PERK_CONTROL_COLORS.architect,
  gradient:
    "linear-gradient(180deg,rgba(163,124,194,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(163,124,194,1) 100%)",
};

// Maverick's background gradient is pinned to its exact Figma spec (same
// rgb(255,142,65)/#FF8E41 color as PERK_THEME_COLOR, but 57% opacity at
// 0%/100% instead of the shared formula's 81%).
PERK_CONTROL_COLORS.maverick = {
  ...PERK_CONTROL_COLORS.maverick,
  gradient:
    "linear-gradient(180deg,rgba(255,142,65,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(255,142,65,1) 100%)",
};

// Shadow's background gradient is pinned to its exact Figma spec (same
// rgb(127,166,202)/#7FA6CA color as PERK_THEME_COLOR, but 57% opacity at
// 0%/100% instead of the shared formula's 81%).
PERK_CONTROL_COLORS.shadow = {
  ...PERK_CONTROL_COLORS.shadow,
  gradient:
    "linear-gradient(180deg,rgba(127,166,202,0.57) 0%,rgba(12,0,0,0.97) 17%," +
    "rgba(0,0,0,1) 88%,rgba(127,166,202,1) 100%)",
};

const FALLBACK_CONTROL_COLORS: PerkControlColorTokens =
  PERK_CONTROL_COLORS.baron;

export const getPerkControlColors = (themeId: string): PerkControlColorTokens =>
  PERK_CONTROL_COLORS[themeId] ?? FALLBACK_CONTROL_COLORS;
