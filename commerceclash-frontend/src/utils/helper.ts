import { images } from "@/assets";
export function toLowerCaseString(input: string): string {
  return input.toLowerCase();
}
export function stars(n: number) {
  const clamped = Math.max(0, Math.min(5, n));
  return "★★★★★".slice(0, clamped);
}

export type CharacterName =
  | "The Visionary"
  | "The Baron"
  | "The Diplomat"
  | "The Tycoon"
  | "The Explorer"
  | "The General"
  | "The Maverick"
  | "The Shadow"
  | "The Architect"
  | "The Phoenix"
  | "The Showman"
  | "The Oracle";

export interface CharacterAssets {
  imageSrc: string;
  imageAlt: string;
  logoSrc: string;
  joinButtonSrc: string;
  color: string;
  backgroundTop: string;
  backgroundBottom?: string;
  bg: string;
  border: string;
  text: string;
  shadow: string;
}

// Canonicalizes raw character-title formatting variations ("baron",
// "the_baron", "the baron", "The Baron") to one comparable lowercase form.
// Shared by normalizeCharacterName below and by any other character-name
// lookup that needs to tolerate the same formats without re-implementing
// this cleanup (e.g. matching a live Character.title against curated,
// canonically-named hero data).
export const normalizeCharacterTitle = (
  raw: string | null | undefined,
): string => {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/^the[_\s]+/, "") // strip leading "the_" or "the "
    .replace(/_/g, " ") // underscores → spaces
    .trim();
};

// Normalize any title format to "The X" canonical form
// e.g. "baron", "the_baron", "the baron", "The Baron" → "The Baron"
const normalizeCharacterName = (
  raw: string | null | undefined,
): CharacterName => {
  if (!raw) return "The Baron" as CharacterName;
  const cleaned = normalizeCharacterTitle(raw);

  const map: Record<string, CharacterName> = {
    visionary: "The Visionary",
    baron: "The Baron",
    diplomat: "The Diplomat",
    tycoon: "The Tycoon",
    explorer: "The Explorer",
    general: "The General",
    maverick: "The Maverick",
    shadow: "The Shadow",
    architect: "The Architect",
    phoenix: "The Phoenix",
    showman: "The Showman",
    oracle: "The Oracle",
  };

  return map[cleaned] ?? ("The Baron" as CharacterName);
};

const DEFAULT_ASSETS: CharacterAssets = {
  imageSrc: images.bgKing,
  imageAlt: "no ceo",
  logoSrc: images.baronLogo,
  joinButtonSrc: images.btnJoinClassBaron,
  color: "#FF0000",
  backgroundTop: "bgBaron",
  backgroundBottom: "bgBaronBottom",
  bg: "bg-baron",
  border: "border-[#FF0000]",
  text: "text-[#FF0000]",
  shadow: "shadow-[inset_0_2px_10px_#FF0000]",
};

export const studentCeoAssets = (
  character: CharacterName | string | null | undefined,
): CharacterAssets => {
  if (!character) return DEFAULT_ASSETS;
  const normalized = normalizeCharacterName(character as string);

  const ceo: Record<CharacterName, CharacterAssets> | any = {
    "The Visionary": {
      imageSrc: images.visionaryV2,
      imageAlt: "visionary",
      logoSrc: images.visionaryLogo,
      joinButtonSrc: images.btnJoinClassInnovator,
      color: "#8B0043",
      backgroundTop: "bgvisionaryTop",
      backgroundBottom: "visionaryBgBottom",
      bg: "bg-visionary",
      border: "border-[#8B0043]",
      text: "text-[#8B0043]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#8B004366]",
    },
    "The Baron": {
      imageSrc: images.baron,
      imageAlt: "baron",
      logoSrc: images.baronLogo,
      joinButtonSrc: images.btnJoinClassBaron,
      color: "#FF0000",
      backgroundTop: "bgBaronTop",
      backgroundBottom: "bgBaronBottom",
      bg: "bg-baron",
      border: "border-[#FF0000]",
      text: "text-[#FF0000]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#FF000066]",
    },
    "The Diplomat": {
      imageSrc: images.diplomat,
      imageAlt: "diplomat",
      logoSrc: images.diplomatLogo,
      joinButtonSrc: images.btnJoinClassDiplomat,
      color: "#8C00FF",
      backgroundTop: "diplomatBgTop",
      backgroundBottom: "diplomatBgBottom",
      bg: "bg-diplomat",
      border: "border-[#8C00FF]",
      text: "text-[#8C00FF]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#8C00FF66]",
    },
    "The Tycoon": {
      imageSrc: images.tycoon,
      imageAlt: "tycoon",
      logoSrc: images.tycoonLogo,
      joinButtonSrc: images.btnJoinClassTycoon,
      color: "#FFCC56",
      backgroundTop: images.bgTycoonTop,
      backgroundBottom: images.bgtycoonBottom,
      bg: "bg-tycoon",
      border: "border-[#FFCC56]",
      text: "text-[#FFCC56]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#FFCC5666]",
    },
    "The Explorer": {
      imageSrc: images.explorer,
      imageAlt: "explorer",
      logoSrc: images.explorerLogo,
      joinButtonSrc: images.btnJoinClassExplorer,
      color: "#42BC00",
      backgroundTop: "bgExplorerTop",
      backgroundBottom: "bgExplorerBottom",
      bg: "bg-explorer",
      border: "border-[#42BC00]",
      text: "text-[#42BC00]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#42BC0066]",
    },
    "The General": {
      imageSrc: images.general,
      imageAlt: "general",
      logoSrc: images.generalLogo,
      joinButtonSrc: images.btnJoinClassGeneral,
      color: "#082DFF",
      backgroundTop: "bgGeneralTop",
      backgroundBottom: "bgGeneralBottom",
      bg: "bg-general",
      border: "border-[#082DFF]",
      text: "text-[#082DFF]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#082DFFF66]",
    },
    "The Maverick": {
      imageSrc: images.maverickCenterBg,
      imageAlt: "maverick",
      logoSrc: images.maverickBadge,
      joinButtonSrc: images.btnJoinClassMaverick,
      color: "#FF8E41",
      backgroundTop: images.maverickBg,
      bg: "bg-maverick",
      border: "border-[#FF8E41]",
      text: "text-[#FF8E41]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#FF8E4166]",
    },
    "The Shadow": {
      imageSrc: images.shadowCenterBg,
      imageAlt: "shadow",
      logoSrc: images.shadowBadge,
      joinButtonSrc: images.btnJoinClassShadow,
      color: "#7FA6CA",
      backgroundTop: images.shadowBg,
      bg: "bg-shadow",
      border: "border-[#7FA6CA]",
      text: "text-[#7FA6CA]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#7FA6CA66]",
    },
    "The Architect": {
      imageSrc: images.architectCenterBg,
      imageAlt: "architect",
      logoSrc: images.architectBadge,
      joinButtonSrc: images.btnJoinClassArchitect,
      color: "#DFB7FF",
      backgroundTop: images.architectBg,
      bg: "bg-architect",
      border: "border-[#DFB7FF]",
      text: "text-[#DFB7FF]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#DFB7FF66]",
    },
    "The Phoenix": {
      imageSrc: images.phoenixCenterBg,
      imageAlt: "phoenix",
      logoSrc: images.phoenixBadge,
      joinButtonSrc: images.btnJoinClassPhoenix,
      color: "#F96400",
      backgroundTop: images.phoenixBg,
      bg: "bg-phoenix",
      border: "border-[#F96400]",
      text: "text-[#F96400]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#F9640066]",
    },
    "The Showman": {
      imageSrc: images.showmanCenterBg,
      imageAlt: "showman",
      logoSrc: images.showmanBadge,
      joinButtonSrc: images.btnJoinClassShowman,
      color: "#00F746",
      backgroundTop: images.showmanBg,
      bg: "bg-showman",
      border: "border-[#00F746]",
      text: "text-[#00F746]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#00F74666]",
    },
    "The Oracle": {
      imageSrc: images.oracleCenterBg,
      imageAlt: "oracle",
      logoSrc: images.oracleBadge,
      joinButtonSrc: images.btnJoinClassOracle,
      color: "#4BFFF3",
      backgroundTop: images.oracleBg,
      bg: "bg-oracle",
      border: "border-[#4BFFF3]",
      text: "text-[#4BFFF3]",
      shadow: "shadow-[inset_-3px_2px_15px_0px_#4BFFF366]",
    },
  };

  return ceo[normalized] ?? DEFAULT_ASSETS;
};

const LEADERBOARD_CEO_IMAGE: Record<CharacterName, string> | any = {
  "The Visionary": images.leaderboardVisionary,
  "The Baron": images.leaderboardBaron,
  "The Diplomat": images.leaderboardDiplomat,
  "The Tycoon": images.leaderboardTycoon,
  "The Explorer": images.leaderboardExplorer,
  "The General": images.leaderboardGeneral,
  "The Maverick": images.leaderboardMaverick,
  "The Shadow": images.leaderboardShadow,
  "The Architect": images.leaderboardArchitect,
  "The Phoenix": images.leaderboardPhoenix,
  "The Showman": images.leaderboardShowman,
  "The Oracle": images.leaderboardOracle,
};

export const leaderboardCeoImage = (
  character: CharacterName | string | null | undefined,
): string => {
  const normalized = normalizeCharacterName(character as string);
  return LEADERBOARD_CEO_IMAGE[normalized] ?? images.leaderboardBaron;
};

const RANK_ICON_CEO_IMAGE: Record<CharacterName, string> | any = {
  "The Visionary": images.rankIconInnovator,
  "The Baron": images.rankIconBaron,
  "The Diplomat": images.rankIconDiplomat,
  "The Tycoon": images.rankIconTycoon,
  "The Explorer": images.rankIconExplorer,
  "The General": images.rankIconGeneral,
  "The Maverick": images.rankIconMaverick,
  "The Shadow": images.rankIconShadow,
  "The Architect": images.rankIconArchitect,
  "The Phoenix": images.rankIconPhoenix,
  "The Showman": images.rankIconShowman,
  "The Oracle": images.rankIconOracle,
};

export const rankIconCeoImage = (
  character: CharacterName | string | null | undefined,
): string => {
  const normalized = normalizeCharacterName(character as string);
  return RANK_ICON_CEO_IMAGE[normalized] ?? images.rankIconBaron;
};

const SCORE_XP_CEO_IMAGE: Record<CharacterName, string> | any = {
  "The Visionary": images.scoreVisionary,
  "The Baron": images.scoreBaron,
  "The Diplomat": images.scoreDiplomat,
  "The Tycoon": images.scoreTycoon,
  "The Explorer": images.scoreExplorer,
  "The General": images.scoreGeneral,
  "The Maverick": images.scoreMaverick,
  "The Shadow": images.scoreShadow,
  "The Architect": images.scoreArchitect,
  "The Phoenix": images.scorePhoenix,
  "The Showman": images.scoreShowman,
  "The Oracle": images.scoreOracle,
};

export const scoreXpCeoImage = (
  character: CharacterName | string | null | undefined,
): string => {
  const normalized = normalizeCharacterName(character as string);
  return SCORE_XP_CEO_IMAGE[normalized] ?? images.scoreBaron;
};

const BADGE_CEO_IMAGE: Record<CharacterName, string> | any = {
  "The Visionary": images.innovatorBadge,
  "The Baron": images.maverickBadge,
  "The Diplomat": images.diplomatBadge,
  "The Tycoon": images.tycoonBadge,
  "The Explorer": images.explorerBadge,
  "The General": images.generalBadge,
  "The Maverick": images.maverickBadge,
  "The Shadow": images.shadowBadge,
  "The Architect": images.architectBadge,
  "The Phoenix": images.phoenixBadge,
  "The Showman": images.showmanBadge,
  "The Oracle": images.oracleBadge,
};

export const badgeCeoImage = (
  character: CharacterName | string | null | undefined,
): string => {
  const normalized = normalizeCharacterName(character as string);
  return BADGE_CEO_IMAGE[normalized] ?? images.badgeBaron;
};
