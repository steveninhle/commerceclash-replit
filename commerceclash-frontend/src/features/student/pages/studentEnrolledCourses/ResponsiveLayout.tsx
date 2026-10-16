import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function ResponsiveLayout({ left, center, right }: ResponsiveLayoutProps) {
  const [viewport, setViewport] = useState(() => {
    if (window.innerWidth < 768) return "mobile";
    if (window.innerWidth < 1280) return "tablet";
    return "desktop";
  });
  const [isOpen, setIsOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isMobile = viewport === "mobile";

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setViewport("mobile");
      else if (window.innerWidth < 1280) setViewport("tablet");
      else setViewport("desktop");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  // ── Desktop ───────────────────────────────────────────────────────────────
  if (viewport === "desktop") {
    return (
      <div
        className="flex flex-1 gap-x-4 px-4 w-full pb-3"
      >
        {left}
        {center}
        {right}
      </div>
    );
  }

  // ── Tablet ────────────────────────────────────────────────────────────────
  // Keep the character panel on the left, with leaderboard/perks above
  // skill investments in the right column.
  if (viewport === "tablet") {
    return (
      <div className="grid flex-1 min-h-0 w-full grid-cols-2 gap-4 px-4 pb-3 overflow-hidden">
        <div className="min-h-0">{center}</div>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
          <div>{left}</div>
          <div>{right}</div>
        </div>
      </div>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 w-full overflow-hidden">
      <div className="h-full w-full">{center}</div>

      {/* Backdrop */}
      {isOpen && (
        <div
          ref={backdropRef}
          className="absolute inset-0 z-20 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={cn(
          "absolute top-0 right-0 h-full w-full z-30 bg-black",
          "transition-transform duration-300 ease-in-out md:pb-20",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-3 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-black text-white text-xs border"
        >
          ✕
        </button>
        <div className="h-full overflow-y-auto flex flex-col">
          <div>{right}</div>
          <div className="border-t border-[#1e2e1f]" />
          <div>{left}</div>
        </div>
      </div>

      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`absolute top-1/2 -translate-y-1/2 right-0 z-40
          w-7 h-14 flex items-center justify-center
          bg-[#0a1a0a]/80 border border-green-700 rounded-l-lg
          text-green-400 text-base ${isOpen ? "hidden" : "block"}`}
        aria-label="Toggle side panel"
      >
        {"◀"}
      </button>
    </div>
  );
}
