import type { CSSProperties } from "react";

export type HeroTheme = {
  id: string;
  primary: string;
};

type RGB = readonly [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = ([r, g, b]: RGB): string =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

const rgbaStr = ([r, g, b]: RGB, a: number): string =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

const lerp = (from: RGB, to: RGB, t: number): RGB => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

const towardBlack = (rgb: RGB, keepPct: number): RGB =>
  lerp(BLACK, rgb, keepPct / 100);
const towardWhite = (rgb: RGB, keepPct: number): RGB =>
  lerp(WHITE, rgb, keepPct / 100);

const THEME_TOKEN_OVERRIDE: Partial<Record<string, CSSProperties>> = {
  baron: {
    "--hs-border-perk": "rgba(255, 0, 0, 0.43)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(255, 0, 0, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#3F0B0C",
  } as CSSProperties,
  diplomat: {
    "--hs-border-perk": "rgba(178, 0, 255, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(140, 0, 255, 1)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#36024D",
  } as CSSProperties,
  explorer: {
    "--hs-border-perk": "rgba(66, 188, 0, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(66, 188, 0, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#20440B",
  } as CSSProperties,
  general: {
    "--hs-border-perk": "rgba(8, 45, 255, 0.5)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(8, 45, 255, 0.65)",
    "--hs-panel-from": "#03071B",
    "--hs-panel-to": "#0E2081",
  } as CSSProperties,

  innovator: {
    "--hs-border-perk": "rgba(255, 164, 208, 0.5)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(255, 164, 208, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#781A47",
  } as CSSProperties,

  tycoon: {
    "--hs-border-perk": "rgba(255, 204, 86, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(255, 204, 86, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#896104",
  } as CSSProperties,

  showman: {
    "--hs-border-perk": "rgba(0, 247, 70, 0.5)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(0, 247, 70, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#065A1E",
  } as CSSProperties,

  phoenix: {
    "--hs-border-perk": "rgba(249, 100, 0, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(249, 100, 0, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#903A00",
  } as CSSProperties,

  oracle: {
    "--hs-border-perk": "rgba(75, 255, 243, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(75, 255, 243, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#035F59",
  } as CSSProperties,

  architect: {
    "--hs-border-perk": "rgba(223, 183, 255, 0.61)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(223, 183, 255, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#47047D",
  } as CSSProperties,

  maverick: {
    "--hs-border-perk": "rgba(255, 142, 65, 1)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(249, 100, 0, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#78560A",
  } as CSSProperties,

  shadow: {
    "--hs-border-perk": "rgba(127, 166, 202, 0.5)",
    "--hs-shadow-perk": "inset -3px 2px 22.7px 0px rgba(127, 166, 202, 0.65)",
    "--hs-panel-from": "#010303",
    "--hs-panel-to": "#28394A",
  } as CSSProperties,
};

const heroThemeStyle = (theme: HeroTheme): CSSProperties => {
  const rgb = hexToRgb(theme.primary);

  return {
    "--hs-primary": theme.primary,
    "--hs-primary-muted": toHex(towardWhite(rgb, 80)),

    "--hs-border-panel": rgbaStr(towardWhite(rgb, 90), 0.42),
    "--hs-border-perk": rgbaStr(rgb, 0.43),
    "--hs-border-control": rgbaStr(rgb, 0.45),
    "--hs-shadow-panel": `0px 114px 36px 0px ${rgbaStr(rgb, 0.02)}`,
    "--hs-shadow-perk": `inset -3px 2px 22.7px 0px ${rgbaStr(rgb, 0.65)}, 0 4px 14px rgba(0, 0, 0, 0.5)`,
    "--hs-shadow-progress": `0 0 16px ${rgbaStr(rgb, 0.55)}`,
    "--hs-shadow-badge": `0 0 18px ${rgbaStr(rgb, 0.45)}`,
    "--hs-panel-from": toHex(towardBlack(rgb, 3)),
    "--hs-panel-to": toHex(towardBlack(rgb, 27)),
    "--hs-perk-from": toHex(towardBlack(rgb, 8)),
    "--hs-control-from": toHex(towardBlack(rgb, 15)),
    "--hs-fill-from": toHex(towardBlack(rgb, 85)),
    "--hs-fill-to": toHex(towardBlack(rgb, 80)),
    ...THEME_TOKEN_OVERRIDE[theme.id],
  } as CSSProperties;
};

export { heroThemeStyle };
