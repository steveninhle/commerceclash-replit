import { BARON_HERO_DATA } from "./sampleData";
import { DIPLOMAT_HERO_DATA } from "./data/diplomat";
import { EXPLORER_HERO_DATA } from "./data/explorer";
import { GENERAL_HERO_DATA } from "./data/general";
import { INNOVATOR_HERO_DATA } from "./data/innovator";
import { TYCOON_HERO_DATA } from "./data/tycoon";
import { SHOWMAN_HERO_DATA } from "./data/showman";
import { PHOENIX_HERO_DATA } from "./data/phoenix";
import { ORACLE_HERO_DATA } from "./data/oracle";
import { ARCHITECT_HERO_DATA } from "./data/architect";
import { MAVERICK_HERO_DATA } from "./data/maverick";
import { SHADOW_HERO_DATA } from "./data/shadow";
import type { HeroSelectCardData } from "./types";

// Left-to-right order matches the source gallery frame.
export const HERO_GALLERY_DATA: HeroSelectCardData[] = [
  BARON_HERO_DATA,
  DIPLOMAT_HERO_DATA,
  EXPLORER_HERO_DATA,
  GENERAL_HERO_DATA,
  INNOVATOR_HERO_DATA,
  TYCOON_HERO_DATA,
  SHOWMAN_HERO_DATA,
  PHOENIX_HERO_DATA,
  ORACLE_HERO_DATA,
  ARCHITECT_HERO_DATA,
  MAVERICK_HERO_DATA,
  SHADOW_HERO_DATA,
];
