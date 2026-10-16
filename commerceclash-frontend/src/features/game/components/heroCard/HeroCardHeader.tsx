import { cn } from "@/lib/utils";

interface HeroCardHeaderProps {
  title: string;
  subtitle: string;
  logoSrc: string;
}

export function HeroCardHeader({ title, subtitle, logoSrc }: HeroCardHeaderProps) {
  return (
    <div className="relative flex items-center justify-center px-4 sm:px-5 pt-3 max-[450px]:pt-2 sm:pt-4 pb-2 max-[450px]:pb-1 sm:pb-3">
      <div className="absolute -top-10 min-[450px]:-top-8  sm:-top-12 left-4 sm:left-5 md:left-6 lg:left-8 flex-shrink-0 z-20">
        <img
          src={logoSrc}
          alt={`${title} logo`}
          className={cn(
            "drop-shadow-lg transition-all duration-300",
            "h-[66px]",
            "min-[400px]:h-[68px]",
            "min-[450px]:h-[72px]",
            "min-[550px]:h-[85px]",
            "sm:h-[95px]",
            "lg:h-[97px]",
            "xxl:h-full",
          )}
        />
      </div>

      {/* Title + Subtitle - centered with flex */}
      <div className="flex flex-col items-center justify-center text-center gap-y-0.5 sm:gap-y-1 md:gap-y-1.5 w-full">
        <p
          className="font-bold uppercase m-0 p-0"
          style={{
            fontFamily: "Unbounded",
            fontWeight: 700,
            fontSize: "clamp(18px, 5vw, 33px)",
            lineHeight: "clamp(22px, 6vw, 38px)",
            letterSpacing: "-0.31px",
            background:
              "radial-gradient(50% 50% at 50% 50%, #FFFFFF 25.96%, #BABABA 90.87%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </p>
        <p
          className="!font-medium !uppercase m-0"
          style={{
            fontFamily: "Geo",
            fontSize: "clamp(12px, 3vw, 20px)",
            lineHeight: "clamp(14px, 3.5vw, 24px)",
            letterSpacing: "clamp(1px, 0.4vw, 2.75px)",
            color: "#9CA3AF",
          }}
        >
          {subtitle?.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
