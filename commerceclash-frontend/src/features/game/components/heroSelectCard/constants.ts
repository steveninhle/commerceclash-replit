export const BREAKPOINT = {
  tablet: "md", // >= 768px — reduced portrait, wider text column
  desktop: "lg", // >= 1024px — full side-by-side proportions
} as const;

export const LAYOUT = {
  maxWidth: "max-w-3xl",
} as const;

export const RADIUS = {
  control: "rounded-[0.9cqw]", // 7/800 — tab pills (rounded-[7px]) and lock-button badge (rounded-[8px])
  perkRow: "rounded-[1.75cqw]", // 14/800 — perk "Card" frames (15:77/15:92)
  perkIcon: "rounded-2xl",
  pill: "rounded-full",

  panel: "rounded-[1.375cqw]",

  progressTrack: "rounded-[1.125cqw]", // 9/800
} as const;

export const Z_INDEX = {
  background: "z-0",
  portrait: "z-10",
  foreground: "z-[15]", // desk/chessboard cutout, layered on top of the portrait
} as const;

// Layered box-shadows approximating the neon bloom around the card and perk
// rows, colored per-hero via CSS custom properties each HeroSelectCard
// instance sets at its root (see theme.ts). Every value here is a plain
// `var(--single-name)` reference — the actual comma-bearing rgba()/gradient/
// multi-layer-shadow CSS lives in theme.ts's inline style, not in a Tailwind
// arbitrary value, because Tailwind v4's candidate parser silently drops
// classes whose arbitrary value contains nested functions like
// `color-mix(in srgb, var(--x) 25%, transparent)` — no rule gets generated
// at all, so the utility looks applied (it's right there in the class list)
// but does nothing. Keep every entry below to a single `var(--x)`.
export const GLOW = {
  // Soft shadow under the stats/perks panel — exact value off node 15:72:
  // `shadow-[0px_114px_46px_0px_rgba(255,0,13,0.03)]`.
  panel: "shadow-[var(--hs-shadow-panel)]",
  perkRow: "shadow-[var(--hs-shadow-perk)]",
  progressBar: "shadow-[var(--hs-shadow-progress)]",
  levelBadge: "drop-shadow-[var(--hs-shadow-badge)]",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
} as const;

export const SURFACE = {
  // Stats/perks panel gradient — exact stops off node 15:72: from-[#010303]
  // to-[#3f0b0c] for Baron; derived per-hero via theme.ts's --hs-panel-*.
  panel: "bg-gradient-to-b from-[var(--hs-panel-from)] to-[var(--hs-panel-to)]",
  perkRow:
    "bg-gradient-to-b from-[color-mix(in_srgb,var(--hs-perk-from)_10%,transparent)] to-black",
  // Tab active/inactive surfaces are per-tab dynamic (each tab has its own
  // identity color) and set via inline style in HeroSelectCardTabs — not
  // representable as a single shared token.
  control: "bg-gradient-to-b from-[var(--hs-control-from)] to-black", // lock button
  // XP bar fill — a 3-stop gradient derived entirely from the theme hex.
  progressFill:
    "bg-gradient-to-b from-[var(--hs-fill-from)] via-[var(--hs-primary)] to-[var(--hs-fill-to)]",
} as const;

// Widths/opacities: panel border is 2px @ 42% alpha (node 15:72, exact:
// `border-2 border-[rgba(255,0,0,0.42)]`); perk-row borders are 2px @ 43%
// (node 15:77/15:92); the XP-track border is a flat neutral gray — not
// theme-tinted — regardless of hero.
export const BORDER = {
  panel: "border-t-2 border-l-2 border-r-2 border-[var(--hs-border-panel)]",
  perkRow: "border-2 border-[var(--hs-border-perk)]",
  progressTrack: "border-2 border-gray-500",
  control: "border-2 border-[var(--hs-border-control)]",
} as const;

export const SPACING = {
  xs: "gap-1 sm:gap-2", // 4 -> 8
  sm: "gap-2 sm:gap-3", // 8 -> 12
  md: "gap-3 sm:gap-4", // 12 -> 16
  lg: "gap-4 sm:gap-6", // 16 -> 24
  xl: "gap-6 sm:gap-8", // 24 -> 32
  headerX: "px-[1.5cqw]",
  sectionX: "px-[2.75cqw]",
  sectionY: "py-[2.75cqw]",
  panelInsetX: "mx-[1.75cqw]",
  perkGap: "gap-[0.75cqw]", // 6/800 — vertical gap between the two perk "Card" frames (775 - 629 - 140)
  tapTarget: "min-h-11 min-w-11",
} as const;

export const COLOR = {
  primary: "text-[var(--hs-primary)]", // brand accent — hero name glow, active tab icon
  primaryMuted: "text-[var(--hs-primary-muted)]", // secondary accents — captions, "next level"
  secondary: "text-gray-300", // body copy
  muted: "text-gray-500", // deemphasized labels
  success: "text-emerald-400", // unlocked perk state
  warning: "text-amber-400", // reserved for future "expiring soon" style states
  danger: "text-red-500", // reserved for future destructive/error states
  info: "text-sky-400", // reserved for future informational callouts
} as const;

export const TEXT_COLOR = {
  accentRed: COLOR.primary,
  mutedRed: COLOR.primaryMuted,
  description: COLOR.secondary,
  locked: COLOR.primaryMuted,
  unlocked: COLOR.success,
} as const;

export const TYPE_SCALE = {
  caption:
    "text-[10px] sm:text-[11px] md:text-xs font-bold uppercase tracking-[0.15em]",
  badge:
    "text-[9px] md:text-[10px] lg:text-[11px] font-bold uppercase tracking-normal",
  secondary:
    "text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wide",
  body: "text-xs sm:text-sm md:text-base leading-relaxed",
} as const;

export const DISPLAY_FONT = "font-['Special_Gothic_Condensed_One',_sans-serif]";

export const TAB_FONT = "font-['Karantina',_sans-serif] font-light";

export const CHROME_TEXT =
  "bg-gradient-to-b from-[#f5f5f5] via-white to-[#9a9a9a] bg-clip-text text-transparent";

export const TRANSITION = {
  hover: "transition-all duration-150",
  press: "transition-transform duration-75 active:scale-95",
  tab: "transition-all duration-200",
  progress: "transition-[width] duration-500 ease-out",
} as const;

export const IMG = {
  contain: "shrink-0 object-contain",
} as const;
