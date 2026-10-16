import { cn } from "@/lib/utils";
import { images } from "@/assets";
import { COLOR, IMG, SPACING, TEXT_COLOR } from "./constants";
import { getPerkControlColors } from "./perkControlColors";
import { resolvePerkActionState } from "../../utils/perkState";

type HeroSelectCardLiveActionButtonProps = {
  unlocked: boolean;
  isUsed: boolean;
  perkStatus?: string | null;
  perkName: string;
  themeId: string;
  onActivate: () => void;
};

const getButtonState = (
  unlocked: boolean,
  isUsed: boolean,
  perkStatus?: string | null,
) => {
  const resolved = resolvePerkActionState(unlocked, isUsed, perkStatus);
  const colorMap = {
    locked: TEXT_COLOR.locked,
    used: COLOR.muted,
    requesting: COLOR.warning,
    pending: COLOR.warning,
    approved: COLOR.info,
    activate: TEXT_COLOR.unlocked,
  };
  return {
    label: resolved.upperLabel,
    clickable: resolved.clickable,
    color: colorMap[resolved.variant],
  };
};

const HeroSelectCardLiveActionButton = ({
  unlocked,
  isUsed,
  perkStatus,
  perkName,
  themeId,
  onActivate,
}: HeroSelectCardLiveActionButtonProps) => {
  const state = getButtonState(unlocked, isUsed, perkStatus);
  const control = getPerkControlColors(themeId);

  const isActive =
    unlocked && !isUsed && (state.clickable || perkStatus === "approved");
  const labelColor = unlocked ? state.color : TEXT_COLOR.accentRed;

  const label = state.clickable
    ? `Activate ${perkName}`
    : `${perkName} is ${state.label.toLowerCase()}.`;

  const tooltipText = !unlocked
    ? `${perkName} is locked. Check its required level and instructor approval.`
    : isUsed
      ? `${perkName} has already been used.`
      : perkStatus === "pending"
          ? `${perkName} approval request has been sent to instructor.`
          : perkStatus === "approved"
            ? `${perkName} is approved; waiting for its effect or selection.`
            : `Click to activate ${perkName}`;

  return (
    <button
      type="button"
      disabled={!state.clickable}
      title={tooltipText}
      aria-label={label}
      onClick={state.clickable ? onActivate : undefined}
      style={{
        borderColor: control.border,
        backgroundImage: control.gradient,
        ["--tw-ring-color" as string]: control.ring,
        ["--perk-active-color" as string]: control.border,
      }}
      className={cn(
        "flex w-[112px] sm:w-[132px] md:w-[150px] shrink-0 items-center justify-center gap-2 px-3 md:px-4",
        SPACING.tapTarget,
        "!border-2 !rounded-[2px]",
        "shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        state.clickable
          ? "cursor-pointer transition-transform duration-150 active:scale-95 hover:brightness-125"
          : "cursor-default",
      )}
    >
      {!unlocked && (
        <img
          src={images.lockKeyhole}
          alt=""
          aria-hidden
          className={cn("h-5 w-5", IMG.contain)}
        />
      )}

      <span
        className={cn(
          "text-[12.3px] sm:text-[14.5px]  min-[1800px]:text-[16px]  font-bold uppercase tracking-normal",
          isActive ? "[color:var(--perk-active-color)]!" : labelColor,
        )}
      >
        {state.label}
      </span>
    </button>
  );
};

export { HeroSelectCardLiveActionButton };
