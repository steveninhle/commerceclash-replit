import { cn } from "@/lib/utils";
import { RADIUS, SPACING, TAB_FONT, TRANSITION } from "./constants";
import type { HeroSelectCardTab } from "./types";

const TAB_GAP = "gap-[clamp(4px,1cqw,8px)]";
const TAB_PADDING_Y = "py-[clamp(8px,1.6cqw,14px)]";
const TAB_ROW_GAP = "gap-[clamp(4px,1cqw,10px)]";

type TabIconProps = {
  icon: string;
  overlay?: string;
  label: string;
};

const TabIcon = ({ icon, overlay, label }: TabIconProps) => {
  return (
    <span className="relative !h-[14px] !w-[14px] shrink-0 sm:!h-5 sm:!w-5">
      <img src={icon} alt={label} className="!h-full !w-full object-contain" />

      {overlay && (
        <img
          src={overlay}
          alt=""
          aria-hidden
          className="absolute !top-1/2 !left-1/2 !h-[45%] !w-[45%] !-translate-x-1/2 !-translate-y-1/2 object-contain"
        />
      )}
    </span>
  );
};

type TabButtonProps = {
  tab: HeroSelectCardTab;
};

const TabButton = ({ tab }: TabButtonProps) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={Boolean(tab.active)}
      aria-label={tab.label}
      disabled={tab.disabled}
      style={
        tab.active
          ? {
              borderColor: `color-mix(in srgb, ${tab.activeColor} 38%, white)`,
              backgroundImage: `linear-gradient(129.87deg, color-mix(in srgb, ${tab.activeColor} 34%, black) 56.811%, ${tab.activeColor} 101.95%)`,
              boxShadow: `inset 0px 1px 4px 0px color-mix(in srgb, ${tab.activeColor} 66%, transparent)`,
            }
          : undefined
      }
      className={cn(
        "!flex !min-w-0 !flex-1 !items-center !justify-center",
        TAB_GAP,
        // TAB_PADDING_X,
        TAB_PADDING_Y,
        SPACING.tapTarget,
        RADIUS.control,
        TRANSITION.tab,
        TRANSITION.press,
        "!focus-visible:outline-none !rounded-[4px] !focus-visible:ring-2 !focus-visible:ring-offset-2 !focus-visible:ring-offset-black",
        tab.active
          ? "!border-b"
          : "!border !border-[#323232] !bg-black hover:!border-white/30",
        tab.disabled ? "!cursor-not-allowed !opacity-40" : "!cursor-pointer",
      )}
    >
      <TabIcon icon={tab.icon} overlay={tab.iconOverlay} label={tab.label} />

      <span
        className={cn(
          TAB_FONT,
          "!min-w-0 !truncate !tracking-[0.5px] leading-tight !pt-[2.5px] !text-[21px] sm:text-[24px] !uppercase @max-[380px]:!hidden !self-center",
          tab.active ? "!text-white" : "!text-[#d9d9d9]",
        )}
      >
        {tab.label}
      </span>
    </button>
  );
};

type HeroSelectCardTabsProps = {
  tabs: HeroSelectCardTab[];
};

const HeroSelectCardTabs = ({ tabs }: HeroSelectCardTabsProps) => {
  return (
    <div
      role="tablist"
      aria-label="Hero sections"
      className={cn("!flex !w-full", TAB_ROW_GAP)}
    >
      {tabs.map((tab: HeroSelectCardTab) => (
        <TabButton key={tab.id} tab={tab} />
      ))}
    </div>
  );
};

export { HeroSelectCardTabs };
