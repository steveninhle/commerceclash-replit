import { cn } from "@/lib/utils";
import { requiredPerkLevel } from "../../utils/perkState";
import { getPerkIcon } from "../PowerUpButton";
import { BORDER, GLOW, RADIUS, SURFACE } from "./constants";
import { PerkIcon, PerkContent } from "./HeroSelectCardPerkItem";
import { HeroSelectCardLiveActionButton } from "./HeroSelectCardLiveActionButton";
import type { Perk } from "../../hooks/heroCard/types";
import type { HeroSelectCardPerk } from "./types";

type PerkIconFallbackProps = {
  title: string;
};

const PerkIconFallback = ({ title }: PerkIconFallbackProps) => {
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16 md:h-20 md:w-20",
        "bg-black/40",
        RADIUS.perkIcon,
      )}
    >
      {getPerkIcon(title)}
    </div>
  );
};

type HeroSelectCardPerkItemLiveProps = {
  perk: Perk;
  visual?: HeroSelectCardPerk;
  dividerAsset?: string;
  themeId: string;
  getEffectiveStatus: (perk: Perk) => string | null;
  onActivate: (perkId: string, title: string) => void;
};

const PERK_ROW_BACKGROUND_OVERRIDE: Partial<Record<string, string>> = {
  baron: "#000",
  diplomat: "#000",
  explorer: "#000",
  general: "#000",
  innovator: "#000",
  // Same flat-black Card pattern confirmed for baron/diplomat/explorer via
  // get_design_context.
  tycoon: "#000",
  showman: "#000",
  phoenix: "#000",
  oracle: "#000",
  architect: "#000",
  maverick: "#000",
  shadow: "#000",
};

const HeroSelectCardPerkItemLive = ({
  perk,
  visual,
  dividerAsset,
  themeId,
  getEffectiveStatus,
  onActivate,
}: HeroSelectCardPerkItemLiveProps) => {
  const unlockLevel =
    requiredPerkLevel(perk.perk_type);

  const perkRowBackground = PERK_ROW_BACKGROUND_OVERRIDE[themeId];
  const backgroundOverride = perkRowBackground
    ? { background: perkRowBackground }
    : undefined;

  return (
    <li
      style={backgroundOverride}
      title={perk.description ?? perk.title}
      className={cn(
        "flex w-full items-center gap-3 sm:gap-4 p-3 sm:p-4",
        RADIUS.perkRow,
        BORDER.perkRow,
        perkRowBackground ? undefined : SURFACE.perkRow,
        GLOW.perkRow,
      )}
    >
      {visual ? (
        <PerkIcon icon={visual.icon} name={perk.title} />
      ) : (
        <PerkIconFallback title={perk.title} />
      )}

      <PerkContent
        name={perk.title}
        nameAsset={visual?.nameAsset}
        unlockLevel={unlockLevel}
        dividerAsset={dividerAsset}
        isUnlocked={perk.is_unlocked}
        description={perk.description}
      />

      <HeroSelectCardLiveActionButton
        unlocked={perk.is_unlocked}
        isUsed={perk.used}
        perkStatus={getEffectiveStatus(perk)}
        perkName={perk.title}
        themeId={themeId}
        onActivate={() => onActivate(perk.id, perk.title)}
      />
    </li>
  );
};

export { HeroSelectCardPerkItemLive };
