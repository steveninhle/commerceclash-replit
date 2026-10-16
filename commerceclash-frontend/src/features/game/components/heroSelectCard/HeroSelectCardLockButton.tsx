import { cn } from "@/lib/utils";
import { images } from "@/assets";
import { IMG, RADIUS, SPACING, TEXT_COLOR, TYPE_SCALE } from "./constants";
import { getPerkControlColors } from "./perkControlColors";

type HeroSelectCardLockButtonProps = {
  locked: boolean;
  perkName: string;
  unlockLevel: number;
  themeId: string;
};

const HeroSelectCardLockButton = ({
  locked,
  perkName,
  unlockLevel,
  themeId,
}: HeroSelectCardLockButtonProps) => {
  const control = getPerkControlColors(themeId);

  const label = locked
    ? `${perkName} is locked. Unlocks at level ${unlockLevel}.`
    : `${perkName} is unlocked.`;

  return (
    <button
      type="button"
      disabled
      aria-label={label}
      // `border`/`from`/`ring` are fed in as raw CSS / `--tw-*` custom
      // properties that the *static* `border-2`/`bg-gradient-to-b to-black`/
      // `focus-visible:ring-2` classes below already read — see the comment
      // on `PerkControlColorTokens` for why a dynamically-built
      // `border-[...]`/`from-[...]`/`ring-[...]` class never compiles.
      style={{
        borderColor: control.border,
        ["--tw-gradient-from" as string]: control.from,
        ["--tw-ring-color" as string]: control.ring,
      }}
      className={cn(
        "flex! w-[112px]! shrink-0! items-center! justify-center! gap-2!",
        "px-3! sm:w-[132px]! sm:px-3! md:w-[150px]! md:px-4!",
        SPACING.tapTarget,
        RADIUS.control,
        "border-2!",
        "bg-gradient-to-b!",
        "to-black!",
        "focus-visible:outline-none!",
        "focus-visible:ring-2!",
        "focus-visible:ring-offset-2!",
        "focus-visible:ring-offset-black!",
        "disabled:cursor-default!",
      )}
    >
      {locked && (
        <img
          src={images.lockKeyhole}
          alt=""
          aria-hidden
          className={cn(
            "h-5! w-5! shrink-0!",
            "sm:h-5! sm:w-5!",
            "md:h-6! md:w-6!",
            IMG.contain,
          )}
        />
      )}

      <span
        className={cn(
          TYPE_SCALE.badge,
          "whitespace-nowrap!",
          "leading-none!",
          "text-xs!",
          "sm:text-sm!",
          "md:text-base!",
          "@[700px]:text-lg!",
          "@[770px]:text-[28px]!",
          "xl:text-[32px]!",
          "2xl:text-[34px]!",
          locked ? TEXT_COLOR.accentRed : TEXT_COLOR.unlocked,
        )}
      >
        {locked ? "LOCKED" : "UNLOCKED"}
      </span>
    </button>
  );
};

export { HeroSelectCardLockButton };
