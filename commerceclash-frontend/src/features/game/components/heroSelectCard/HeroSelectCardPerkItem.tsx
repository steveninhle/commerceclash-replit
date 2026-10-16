import { cn } from "@/lib/utils";
import {
  BORDER,
  CHROME_TEXT,
  DISPLAY_FONT,
  GLOW,
  IMG,
  RADIUS,
  SURFACE,
  TEXT_COLOR,
  TYPE_SCALE,
} from "./constants";
import { HeroSelectCardDivider } from "./HeroSelectCardDivider";
import { HeroSelectCardLockButton } from "./HeroSelectCardLockButton";
import type { HeroSelectCardPerk } from "./types";

type PerkIconProps = {
  icon: string;
  name: string;
};

export const PerkIcon = ({ icon, name }: PerkIconProps) => {
  return (
    <img
      src={icon}
      alt={name}
      className={cn(
        "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20",
        IMG.contain,
        RADIUS.perkIcon,
      )}
    />
  );
};

type UnlockRequirementProps = {
  unlockLevel?: number;
  dividerAsset?: string;
  isUnlocked?: boolean;
};

const UnlockRequirement = ({
  unlockLevel,
  dividerAsset,
  isUnlocked,
}: UnlockRequirementProps) => {
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={cn(
          TYPE_SCALE.caption,
          isUnlocked ? "!text-emerald-400 font-semibold" : TEXT_COLOR.accentRed,
        )}
      >
        {isUnlocked
          ? unlockLevel !== undefined
            ? `LEVEL ${unlockLevel} UNLOCKED`
            : "UNLOCKED"
          : unlockLevel !== undefined
            ? `UNLOCKS AT LEVEL ${unlockLevel}`
            : "LOCKED"}
      </span>
      <HeroSelectCardDivider
        asset={dividerAsset}
        className="h-3 w-20 sm:w-24"
      />
    </div>
  );
};

type PerkContentProps = {
  name: string;
  nameAsset?: string;
  unlockLevel?: number;
  dividerAsset?: string;
  isUnlocked?: boolean;
  description?: string;
};

export const PerkContent = ({
  name,
  nameAsset,
  unlockLevel,
  dividerAsset,
  isUnlocked,
}: PerkContentProps) => {
  return (
    <div className="!flex !min-w-0 !flex-1 !flex-col !items-start !gap-1 sm:!gap-1.5">
      {nameAsset ? (
        <img
          src={nameAsset}
          alt={name}
          className="!h-6 sm:!h-7 md:!h-9 !w-auto !max-w-full !object-contain"
        />
      ) : (
        <span
          className={cn(
            DISPLAY_FONT,
            CHROME_TEXT,
            "!text-[22px] sm:!text-[24px] md:!text-[26px] lg:!text-[28px]  2xl:!text-[32px] min-[1920px]:!text-[36px] !tracking-wide [text-shadow:2px_2px_4px_rgba(0,0,0,0.25)]",
          )}
        >
          {name}
        </span>
      )}

      <UnlockRequirement
        unlockLevel={unlockLevel}
        dividerAsset={dividerAsset}
        isUnlocked={isUnlocked}
      />
    </div>
  );
};

type HeroSelectCardPerkItemProps = {
  perk: HeroSelectCardPerk;
  dividerAsset?: string;
  themeId: string;
};

const HeroSelectCardPerkItem = ({
  perk,
  dividerAsset,
  themeId,
}: HeroSelectCardPerkItemProps) => {
  return (
    <li
      className={cn(
        "flex w-full items-center gap-3 sm:gap-4 p-3 sm:p-4",
        RADIUS.perkRow,
        BORDER.perkRow,
        SURFACE.perkRow,
        GLOW.perkRow,
      )}
    >
      <PerkIcon icon={perk.icon} name={perk.name} />
      <PerkContent
        name={perk.name}
        nameAsset={perk.nameAsset}
        unlockLevel={perk.unlockLevel}
        dividerAsset={dividerAsset}
      />
      <HeroSelectCardLockButton
        locked={perk.locked}
        perkName={perk.name}
        unlockLevel={perk.unlockLevel}
        themeId={themeId}
      />
    </li>
  );
};

export { HeroSelectCardPerkItem };
