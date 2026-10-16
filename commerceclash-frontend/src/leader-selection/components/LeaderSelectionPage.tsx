import { Diamond } from "lucide-react";
import { LEADERS } from "../constants/leaders";
import { SEATED_PLAYERS, TOTAL_SEATS } from "../constants/players";
import { useLeaderSelection } from "../hooks/useLeaderSelection";
import { HeroSection } from "./HeroSection";
import { LeaderCarousel } from "./LeaderCarousel";
import { LeaderInfoCard } from "./LeaderInfoCard";
import { LeaderPerks } from "./LeaderPerks";
import { LeaderSidebar } from "./LeaderSidebar";
import { LeaderStatsCard } from "./LeaderStatsCard";

interface LeaderSelectionPageProps {
  onConfirm?: (leaderId: string) => void;
}

/** "Choose Your CEO" screen — composes sidebar, hero, info, stats, perks and carousel. */
export const LeaderSelectionPage = ({ onConfirm }: LeaderSelectionPageProps) => {
  const { leaders, selectedLeader, selectLeader, selectNext, selectPrevious } =
    useLeaderSelection(LEADERS);

  if (!selectedLeader) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-center text-sm text-white/40">
        No leaders are available right now. Please try again later.
      </div>
    );
  }

  const handleConfirm = () => onConfirm?.(selectedLeader.id);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050816] px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex items-center justify-center gap-3">
          <Diamond className="size-3.5 shrink-0 text-amber-400/80" aria-hidden="true" />
          <h1 className="bg-gradient-to-b from-white to-slate-300/80 bg-clip-text text-2xl font-extrabold uppercase tracking-[0.15em] text-transparent sm:text-3xl lg:text-4xl">
            Choose Your CEO
          </h1>
          <Diamond className="size-3.5 shrink-0 text-amber-400/80" aria-hidden="true" />
        </header>

        {/*
          Four-tier composition, controlled purely with flex `order` so the DOM order
          (needed for the mobile reading order) never has to match the visual order:
            - Mobile (<md):     Hero -> Info -> Stats -> Perks -> Carousel -> Sidebar (single column)
            - Tablet (md):      Sidebar | Hero | Info  in one row, Stats+Perks side-by-side full width below
            - Desktop (lg):     Sidebar | Hero | Info | (Stats over Perks) all in one row, compact widths
            - Desktop (xl+):    same one-row composition, full-size widths
          The lg tier uses narrower fixed widths than xl so the 4-column row still fits (without an
          unwanted wrap onto a second line) right at the 1024px breakpoint edge.
        */}
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-stretch">
          <div className="order-6 md:order-1 md:w-[150px] md:shrink-0 lg:w-[220px] xl:w-[272px]">
            <LeaderSidebar
              players={SEATED_PLAYERS}
              totalSeats={TOTAL_SEATS}
              selectedColor={selectedLeader.color}
            />
          </div>

          <div className="order-1 md:order-2 md:min-w-0 md:flex-1">
            <HeroSection leader={selectedLeader} />
          </div>

          <div className="order-2 flex flex-col gap-6 rounded-2xl border border-amber-200/10 bg-white/[0.02] p-5 md:order-3 md:w-[220px] md:shrink-0 md:p-4 lg:w-[280px] lg:p-5 xl:w-[340px] xl:p-6">
            <LeaderInfoCard leader={selectedLeader} onConfirm={handleConfirm} />
          </div>

          <div className="order-3 flex flex-col gap-4 md:order-4 md:w-full md:flex-row lg:w-[240px] lg:shrink-0 lg:flex-col xl:w-[300px]">
            <div className="order-4 md:order-none md:flex-1 lg:flex-none">
              <LeaderStatsCard leader={selectedLeader} />
            </div>
            <div className="order-5 md:order-none md:flex-1 lg:flex-none">
              <LeaderPerks leader={selectedLeader} />
            </div>
          </div>

          <div className="order-5 md:order-5 md:w-full">
            <LeaderCarousel
              leaders={leaders}
              selectedId={selectedLeader.id}
              onSelect={selectLeader}
              onNext={selectNext}
              onPrevious={selectPrevious}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
