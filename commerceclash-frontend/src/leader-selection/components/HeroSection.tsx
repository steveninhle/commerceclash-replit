import { AnimatePresence, motion } from "framer-motion";
import type { Leader } from "../types";
import { FloatingCrystal } from "./FloatingCrystal";
import { LeaderAtmosphere } from "./LeaderAtmosphere";

interface HeroSectionProps {
  leader: Leader;
}

/** Full-bleed portrait stage: leader artwork covers the entire hero area, glow behind it. */
export const HeroSection = ({ leader }: HeroSectionProps) => {
  const emblemIcon = leader.perks[0]?.icon;

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl md:min-h-[600px] lg:min-h-[700px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${leader.color}3d, transparent 68%)`,
        }}
      />

      <LeaderAtmosphere leader={leader} />

      <AnimatePresence mode="wait">
        {/*
          The source artwork's usable character content sits in roughly the top ~55-60% of the
          canvas — the rest is empty/atmospheric filler. `object-cover` alone can't remove that
          (most of our container aspect ratios end up showing the image at 0% pre-crop), so we
          apply an extra top-anchored zoom on top of cover to push the dead space out of frame.
          The zoom is dialed back at 2xl because very wide hero columns already get most of that
          crop "for free" from `cover`'s own math, and stacking the full zoom on top of that would
          crop into the character instead of the empty space.
        */}
        <motion.img
          key={leader.id}
          src={leader.avatar}
          alt={`${leader.name} portrait`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute inset-0 z-[2] h-full w-full object-cover object-top drop-shadow-2xl"
        />
      </AnimatePresence>

      {emblemIcon && (
        <FloatingCrystal
          animationKey={`${leader.id}-emblem`}
          icon={emblemIcon}
          color={leader.color}
        />
      )}

      <span
        className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-medium text-white/70 backdrop-blur-sm lg:bottom-4"
        aria-label={`Represents ${leader.country}`}
      >
        <span aria-hidden="true">{leader.countryFlag}</span>
        {leader.country}
      </span>

      {/*
        The hero artwork is scaled up (see the zoom comment above), which promotes it to its own
        compositing layer — that layer can paint over the container's own `border`, even with
        `overflow-hidden` on the container. Drawing the border as its own top-layer overlay,
        stacked above the image instead of relying on the container's box border, sidesteps that.
      */}
    </div>
  );
};
