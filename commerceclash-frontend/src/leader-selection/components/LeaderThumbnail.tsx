import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Leader } from "../types";

interface LeaderThumbnailProps {
  leader: Leader;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A single collectible-card entry in the leader carousel: artwork fills the top ~75% of the
 * card, a colored label band with the name + archetype glyph fills the remaining ~25%.
 */
export const LeaderThumbnail = memo(({ leader, isSelected, onSelect }: LeaderThumbnailProps) => {
  const GlyphIcon = leader.perks[0]?.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(leader.id)}
      aria-pressed={isSelected}
      aria-label={`Select ${leader.name}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      animate={{ scale: isSelected ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative flex h-56 w-28 shrink-0 flex-col overflow-hidden rounded-xl border-2",
        "snap-center bg-white/[0.02] transition-[opacity,border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]",
        "sm:h-64 sm:w-32 lg:h-72 lg:w-36",
        isSelected ? "opacity-100" : "opacity-70 hover:opacity-95",
      )}
      style={{
        borderColor: isSelected ? leader.color : `${leader.color}33`,
        boxShadow: isSelected
          ? `0 0 24px -4px ${leader.color}, 0 8px 20px -8px rgba(0,0,0,0.6)`
          : undefined,
      }}
    >
      {isSelected && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-[10px] border-2"
          style={{ borderColor: leader.color }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative min-h-0 flex-[3]">
        <img
          src={leader.avatar}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-top"
          loading="lazy"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent"
        />
      </div>

      <div
        className="flex flex-1 flex-col items-center justify-center gap-1 px-1.5"
        style={{ backgroundColor: `${leader.color}14` }}
      >
        <span
          className={cn(
            "truncate text-center text-[11px] font-bold uppercase leading-tight tracking-tight sm:text-xs",
            isSelected ? "text-white" : "text-white/60 group-hover:text-white/85",
          )}
        >
          {leader.name}
        </span>
        {GlyphIcon && (
          <GlyphIcon
            className="size-3.5 shrink-0"
            style={{ color: isSelected ? leader.color : `${leader.color}99` }}
            aria-hidden="true"
          />
        )}
      </div>
    </motion.button>
  );
});

LeaderThumbnail.displayName = "LeaderThumbnail";
