import { images } from "@/assets";
import { HERO_GALLERY_DATA } from "@/features/game/components/heroSelectCard/heroesData";
import { normalizeCharacterTitle } from "@/utils/helper";
import architectVideo from "@/assets/mp4/chooseCeoArchitect.mp4";
import baronVideo from "@/assets/mp4/chooseCeoBaron.mp4";
import diplomatVideo from "@/assets/mp4/chooseCeoDiplomat.mp4";
import explorerVideo from "@/assets/mp4/chooseCeoExplorer.mp4";
import generalVideo from "@/assets/mp4/chooseCeoGeneral.mp4";
import innovatorVideo from "@/assets/mp4/chooseCeoInnovator.mp4";
import maverickVideo from "@/assets/mp4/chooseCeoMaverick.mp4";
import oracleVideo from "@/assets/mp4/chooseCeoOracle.mp4";
import phoenixVideo from "@/assets/mp4/chooseCeoPhoenix.mp4";
import shadowVideo from "@/assets/mp4/chooseCeoShadow.mp4";
import showmanVideo from "@/assets/mp4/chooseCeoShowman.mp4";
import tycoonVideo from "@/assets/mp4/chooseCeoTycoon.mp4";
import architectFigure from "@/assets/images/figure/ARCHITECT.png";
import diplomatFigure from "@/assets/images/figure/CARACTOR DIPOMAT.png";
import explorerFigure from "@/assets/images/figure/EXPLORERE.png";
import generalFigure from "@/assets/images/figure/GENERAL.png";
import innovatorFigure from "@/assets/images/figure/INNOVATOR.png";
import maverickFigure from "@/assets/images/figure/MAVERICK.png";
import oracleFigure from "@/assets/images/figure/ORACLE.png";
import phoenixFigure from "@/assets/images/figure/PHEONIX.png";
import showmanFigure from "@/assets/images/figure/SHOWMAN.png";
import tycoonFigure from "@/assets/images/figure/TYCOON.png";
import architectConfirm from "@/assets/images/btn-confirm/architect.png";
import baronConfirm from "@/assets/images/btn-confirm/baron.png";
import diplomatConfirm from "@/assets/images/btn-confirm/diplomat.png";
import explorerConfirm from "@/assets/images/btn-confirm/explorer.png";
import generalConfirm from "@/assets/images/btn-confirm/general.png";
import innovatorConfirm from "@/assets/images/btn-confirm/innovator.png";
import maverickConfirm from "@/assets/images/btn-confirm/maverick.png";
import oracleConfirm from "@/assets/images/btn-confirm/oracle.png";
import phoenixConfirm from "@/assets/images/btn-confirm/phoenix.png";
import shadowConfirm from "@/assets/images/btn-confirm/shadow.png";
import showmanConfirm from "@/assets/images/btn-confirm/showman.png";
import tycoonConfirm from "@/assets/images/btn-confirm/tycoon.png";
import architectTitle from "@/assets/images/bg-text/the-architect.png";
import baronTitle from "@/assets/images/bg-text/the-baron.png";
import diplomatTitle from "@/assets/images/bg-text/the-diplomat.png";
import explorerTitle from "@/assets/images/bg-text/the-explorer.png";
import generalTitle from "@/assets/images/bg-text/the-general.png";
import innovatorTitle from "@/assets/images/bg-text/the-innovator.png";
import maverickTitle from "@/assets/images/bg-text/the-maverick.png";
import oracleTitle from "@/assets/images/bg-text/the-oracle.png";
import phoenixTitle from "@/assets/images/bg-text/the-phoenix.png";
import shadowTitle from "@/assets/images/bg-text/the-shadow.png";
import showmanTitle from "@/assets/images/bg-text/the-showman.png";
import tycoonTitle from "@/assets/images/bg-text/the-tycoon.png";

// Full-body hero art, keyed by the same lowercase slug as
// normalizeCharacterTitle()'s output (e.g. "The Baron" -> "baron").
const HERO_ART: Record<string, string> = {
  baron: images.baron,
  diplomat: images.diplomat,
  explorer: images.explorer,
  general: images.general,
  innovator: images.innovator,
  tycoon: images.tycoon,
  showman: images.showman,
  phoenix: images.phoenix,
  oracle: images.oracle,
  architect: images.architect,
  maverick: images.maverick,
  shadow: images.shadow,
  visionary: images.visionary,
};

const CEO_FIGURES: Record<string, string> = {
  architect: architectFigure,
  baron: images.baroon,
  diplomat: diplomatFigure,
  explorer: explorerFigure,
  general: generalFigure,
  innovator: innovatorFigure,
  maverick: maverickFigure,
  oracle: oracleFigure,
  phoenix: phoenixFigure,
  shadow: images.shadow,
  showman: showmanFigure,
  tycoon: tycoonFigure,
  visionary: innovatorFigure,
};

const CEO_CONFIRM_BUTTONS: Record<string, string> = {
  architect: architectConfirm,
  baron: baronConfirm,
  diplomat: diplomatConfirm,
  explorer: explorerConfirm,
  general: generalConfirm,
  innovator: innovatorConfirm,
  maverick: maverickConfirm,
  oracle: oracleConfirm,
  phoenix: phoenixConfirm,
  shadow: shadowConfirm,
  showman: showmanConfirm,
  tycoon: tycoonConfirm,
  visionary: innovatorConfirm,
};

const CEO_TITLE_IMAGES: Record<string, string> = {
  architect: architectTitle,
  baron: baronTitle,
  diplomat: diplomatTitle,
  explorer: explorerTitle,
  general: generalTitle,
  innovator: innovatorTitle,
  maverick: maverickTitle,
  oracle: oracleTitle,
  phoenix: phoenixTitle,
  shadow: shadowTitle,
  showman: showmanTitle,
  tycoon: tycoonTitle,
  visionary: innovatorTitle,
};

const CEO_BACKGROUND_VIDEOS: Record<string, string> = {
  architect: architectVideo,
  baron: baronVideo,
  diplomat: diplomatVideo,
  explorer: explorerVideo,
  general: generalVideo,
  innovator: innovatorVideo,
  maverick: maverickVideo,
  oracle: oracleVideo,
  phoenix: phoenixVideo,
  shadow: shadowVideo,
  showman: showmanVideo,
  tycoon: tycoonVideo,
  // The legacy "Visionary" title uses the Innovator visual set.
  visionary: innovatorVideo,
};

// Flavor-text descriptions aren't returned by GET /class/:cid/ceo (it only
// has id/title/sub_title/perks), so we borrow the narrative copy already
// written for the heroSelectCard gallery, matched by normalized title.
const HERO_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  HERO_GALLERY_DATA.map((hero) => [normalizeCharacterTitle(hero.name), hero.description]),
);

export const heroArtFor = (title: string): string | undefined =>
  HERO_ART[normalizeCharacterTitle(title)];

export const ceoFigureFor = (title: string | null | undefined): string =>
  CEO_FIGURES[normalizeCharacterTitle(title)] ?? images.baroon;

export const ceoConfirmButtonFor = (title: string | null | undefined): string =>
  CEO_CONFIRM_BUTTONS[normalizeCharacterTitle(title)] ?? baronConfirm;

export const ceoTitleImageFor = (title: string | null | undefined): string =>
  CEO_TITLE_IMAGES[normalizeCharacterTitle(title)] ?? baronTitle;

export const ceoBackgroundVideoFor = (
  title: string | null | undefined,
): string => CEO_BACKGROUND_VIDEOS[normalizeCharacterTitle(title)] ?? baronVideo;

export const heroDescriptionFor = (title: string): string | undefined =>
  HERO_DESCRIPTIONS[normalizeCharacterTitle(title)];
