import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationArrowProps {
  direction: "prev" | "next";
  onClick: () => void;
}

/** Prev/next chevron button for the leader carousel. */
export const NavigationArrow = ({ direction, onClick }: NavigationArrowProps) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous leader" : "Next leader"}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10
        bg-white/[0.03] text-white/60 transition-colors hover:bg-white/10 hover:text-white
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
};
