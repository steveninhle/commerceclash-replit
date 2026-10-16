import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Lock,
  Megaphone,
  RefreshCw,
  Flame,
  TrendingUp,
  Gem,
  Bomb,
  Star,
  ShieldCheck,
} from "lucide-react";
import { PowerupCardProps } from "@/components/types";
import { useState, useRef } from "react";
import { PokerChipX2 } from "@/assets/svgs/Pokerchip";

const BulldozerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
    <defs>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="100%" stopColor="white" stopOpacity="0.15" />
      </linearGradient>
    </defs>

    <rect
      x="4"
      y="44"
      width="44"
      height="12"
      rx="5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />

    <circle cx="10" cy="50" r="3.5" fill="currentColor" />
    <circle cx="42" cy="50" r="3.5" fill="currentColor" />

    {[16, 22, 28, 34].map((x) => (
      <circle key={x} cx={x} cy="50" r="2" fill="currentColor" />
    ))}

    {[8, 12, 14, 18, 20, 24, 26, 30, 32, 36, 38, 40, 44].map((x) => (
      <rect
        key={x}
        x={x}
        y="48"
        width="1.2"
        height="4"
        fill="currentColor"
        opacity="0.6"
      />
    ))}

    <path d="M12 34 L12 44 L42 44 L42 34 Z" fill="currentColor" />
    <rect
      x="12"
      y="42"
      width="30"
      height="3"
      fill="currentColor"
      opacity="0.7"
    />

    <rect x="26" y="20" width="14" height="15" rx="2" fill="currentColor" />
    <rect x="24" y="18" width="18" height="3" rx="1.5" fill="currentColor" />

    <rect x="28" y="22" width="10" height="8" rx="1.5" fill="url(#glass)" />
    <line
      x1="33"
      y1="22"
      x2="33"
      y2="30"
      stroke="currentColor"
      strokeWidth="0.8"
      opacity="0.5"
    />

    <rect x="36" y="12" width="2.5" height="8" rx="1" fill="currentColor" />
    <path d="M35 12 L39 12 L38.5 11 L35.5 11 Z" fill="currentColor" />

    <path d="M2 36 L4 36 L4 48 L2 48 Z" fill="currentColor" />
    <path d="M2 34 Q0 34 0 37 L0 48 L2 48 Z" fill="currentColor" />

    <rect
      x="2"
      y="34"
      width="10"
      height="14"
      rx="1.5"
      fill="currentColor"
      opacity="0.9"
    />
    <rect x="2" y="34" width="10" height="3" rx="1" fill="currentColor" />

    <path d="M12 40 L24 30 L26 33 L14 43 Z" fill="currentColor" />

    <line
      x1="20"
      y1="32"
      x2="28"
      y2="26"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="20" cy="32" r="2.5" fill="currentColor" />
    <circle cx="28" cy="26" r="2" fill="currentColor" />

    <circle cx="8" cy="38" r="2" fill="white" opacity="0.7" />
    <circle cx="8" cy="38" r="1" fill="#FFD700" />
    <circle cx="8" cy="38" r="0.5" fill="white" />

    <circle cx="44" cy="38" r="2" fill="white" opacity="0.7" />
    <circle cx="44" cy="38" r="1" fill="#FF3333" />

    <rect
      x="40"
      y="22"
      width="2"
      height="4"
      rx="0.5"
      fill="currentColor"
      opacity="0.6"
    />
    <circle cx="42" cy="23" r="1" fill="white" opacity="0.4" />

    <line
      x1="14"
      y1="38"
      x2="24"
      y2="38"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.3"
    />
    <line
      x1="14"
      y1="40"
      x2="24"
      y2="40"
      stroke="white"
      strokeWidth="0.8"
      opacity="0.3"
    />
  </svg>
);
export const getPerkIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("sabotage"))
    return (
      <Bomb className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("trendsetter"))
    return (
      <Star className="relative z-10 h-6 w-6 text-[#56FFD0] fill-[#56FFD0]/30" />
    );
  if (t.includes("rallying") || t.includes("cry"))
    return (
      <Megaphone className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("revered") || t.includes("icon"))
    return (
      <ShieldCheck className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("strategic") || t.includes("rebirth"))
    return (
      <RefreshCw className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("moment") || t.includes("glory"))
    return (
      <Flame className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("compounding") || t.includes("gains"))
    return (
      <TrendingUp className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("corporate") || t.includes("empire"))
    return (
      <Gem className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("danger") || t.includes("zone"))
    return (
      <Bomb className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("flame") || t.includes("afterburner"))
    return (
      <Flame className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("spotlight") || t.includes("star"))
    return (
      <Star className="relative z-10 h-6 w-6 text-[#56FFD0] fill-[#56FFD0]/30" />
    );
  if (t.includes("prophecy") || t.includes("crystal") || t.includes("insider"))
    return (
      <Gem className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  if (t.includes("double") || t.includes("down")) return <PokerChipX2 />;
  if (t.includes("wipeout"))
    return (
      <BulldozerIcon className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
    );
  return (
    <Zap className="relative z-10 h-6 w-6 text-[#56FFD0] drop-shadow-[0_0_10px_rgba(86,255,208,0.8)]" />
  );
};

export function PowerupCard({
  title = "Double-Down",
  description = "On scenario win, steal runner up's MS",
  actionLabel,
  onAction,
  className,
  unlocked = true,
  perkStatus = "request",
  isUsed = false,
  perk_type,
}: PowerupCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const getButtonState = () => {
    if (!unlocked)
      return { label: "Locked", disabled: true, variant: "locked" };
    if (isUsed) return { label: "Used", disabled: true, variant: "used" };
    if (perkStatus === "pending")
      return { label: "Requested", disabled: true, variant: "pending" };
    if (perkStatus === "approved")
      return { label: "In Use", disabled: true, variant: "approved" };
    if (perkStatus === "denied")
      return { label: "Activate", disabled: false, variant: "activate" };
    if (perkStatus === "request")
      return { label: "Activate", disabled: false, variant: "activate" };
    return { label: "Activate", disabled: false, variant: "activate" };
  };

  const buttonState = getButtonState();
  const displayLabel = actionLabel || buttonState.label;
  const isButtonDisabled = !unlocked || buttonState.disabled;

  return (
    <>
      <Card
        className={cn(
          "relative isolate w-full overflow-hidden",
          "rounded-[12px] sm:rounded-[14px] md:rounded-[16px]",
          "px-3 min-[550px]:px-[14px]  md:px-4",
          "h-[92px] min-[550px]:h-[114px] sm:h-[96px] md:h-[96px]",
          "border-[1.5px]",
          unlocked
            ? "border-[#56FFD044] bg-[#162E2B]"
            : "border-[#ffffff10] bg-[#2A3038]",
          "transition-all duration-200 hover:scale-[1.01]",
          className,
        )}
        role="region"
        aria-label={title}
      >
        {unlocked && (
          <div
            className="absolute bottom-0 left-0 w-full h-[4px] sm:h-[5px] md:h-[6px] pointer-events-none z-0"
            style={{
              background:
                "radial-gradient(50% 100% at 50% 100%, #56FFD066 0%, transparent 100%)",
            }}
          />
        )}

        <div className="flex items-center gap-[12px] min-[550px]:gap-[13px] sm:gap-[14px] md:gap-4 w-full h-full relative z-10">
          <div className="relative flex-shrink-0 w-[33px] h-[33px] min-[550px]:w-[37px] min-[550px]:h-[37px] sm:w-[42px] sm:h-[42px] md:w-[46px] md:h-[46px] flex items-center justify-center">
            <div
              className={cn(
                "absolute inset-0 w-full h-full rotate-45 rounded-[7px] sm:rounded-[8px] md:rounded-[9px]",
                unlocked
                  ? "bg-[#0D3D2E] border border-[#1A6B4A]"
                  : "bg-[#3A3F47] border border-[#ffffff18]",
              )}
            />
            {unlocked ? (
              getPerkIcon(title)
            ) : (
              <Lock className="relative z-10 h-[14px] w-[14px] sm:h-[16px] sm:w-[16px] md:h-[18px] md:w-[18px] text-[#6B7280]" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-[2px] sm:gap-[3px] md:gap-[6px]">
            <p
              className={cn(
                "truncate",
                unlocked ? "text-white" : "text-[#8A9099]",
              )}
              style={{
                fontFamily: "Unbounded, system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "clamp(18px, 4vw, 25px)",
                lineHeight: "24px",
                letterSpacing: "-0.31px",
              }}
            >
              {title}
            </p>
            {unlocked ? (
              <p
                ref={descriptionRef}
                className="text-[#9CA3AF] line-clamp-2 cursor-help"
                style={{
                  fontFamily: "Geo, system-ui, sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(12px, 3vw, 15px)",
                  lineHeight: "20px",
                }}
                onMouseEnter={() => {
                  if (descriptionRef.current) {
                    const rect = descriptionRef.current.getBoundingClientRect();
                    setTooltipPosition({
                      top: rect.bottom + window.scrollY + 8,
                      left: rect.left + window.scrollX,
                    });
                  }
                  setShowTooltip(true);
                }}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {description}
              </p>
            ) : (
              <p
                className="text-[#6B7280]"
                style={{
                  fontFamily: "Geo, system-ui, sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(12px, 3vw, 16px)",
                  lineHeight: "21px",
                }}
              >
                {perk_type === "ULTRA"
                  ? "Unlocked at Level 5"
                  : "Unlocked at Level 3"}
              </p>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            disabled={isButtonDisabled}
            aria-disabled={isButtonDisabled}
            className={cn(
              "!relative !flex-shrink-0 !rounded-[8px]  !uppercase !tracking-wider sm:!tracking-widest",
              "w-[74px] max-[550px]:w-[80px] sm:w-[90px] md:w-[106px]",
              "h-[30px] max-[550px]:h-[33px] sm:h-[35px] md:h-[38px]",
              "!text-[10px] !font-bold !border-0 !transition-all !duration-200 !bg-transparent !shadow-none",
              "!bg-transparent active:!bg-transparent focus:!bg-transparent",

              !isButtonDisabled &&
                buttonState.variant === "activate" &&
                "before:absolute before:inset-0 before:rounded-full before:blur-md before:opacity-70 before:z-0 before:transition-all before:duration-300",

              !isButtonDisabled && buttonState.variant === "activate"
                ? "text-[#0A1F1A] active:scale-95 hover:scale-105"
                : "text-[#9CA3AF] cursor-not-allowed !bg-neutral-600 hover:!bg-neutral-600",
            )}
            style={{
              fontFamily: "Unbounded, system-ui, sans-serif",
              textTransform: "uppercase",
              ...(!isButtonDisabled && buttonState.variant === "activate"
                ? {
                    background:
                      "linear-gradient(90deg, #1EAB8C 0%, #55FBCD 50%, #25B695 100%)",
                    color: "black",
                  }
                : { background: "#3A4149" }),
            }}
            onClick={!isButtonDisabled ? onAction : undefined}
          >
            {/* Glow layer */}
            {!isButtonDisabled && buttonState.variant === "activate" && (
              <span
                className="absolute inset-0 rounded-full blur-lg opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, #1EAB8C 0%, #55FBCD 50%, #25B695 100%)",
                }}
              />
            )}

            {/* Content */}
            <span className="relative z-10">{displayLabel}</span>
          </Button>
        </div>
      </Card>

      {showTooltip && (
        <div
          className="fixed z-[9999] px-3 py-2 rounded-lg shadow-lg max-w-xs text-xs leading-relaxed bg-gray-900 text-white border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          {description}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45" />
        </div>
      )}
    </>
  );
}
