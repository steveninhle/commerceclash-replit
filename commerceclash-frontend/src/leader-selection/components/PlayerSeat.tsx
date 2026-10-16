import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeatedPlayer } from "../types";
import { getInitials } from "../utils";

interface PlayerSeatProps {
  player?: SeatedPlayer;
  accentColor?: string;
}

/** One lobby slot: a seated player's initials/flag, or an empty waiting seat. */
export const PlayerSeat = ({ player, accentColor }: PlayerSeatProps) => {
  if (!player) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/20 p-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/25">
          <User className="size-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/30">
          Open Seat
        </span>
      </div>
    );
  }

  const highlight = player.isCurrentUser && accentColor;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-2.5 transition-colors duration-300",
        !highlight && "border-white/[0.08] bg-white/[0.02]",
      )}
      style={
        highlight
          ? {
              borderColor: `${accentColor}80`,
              backgroundColor: `${accentColor}14`,
              boxShadow: `0 0 16px -6px ${accentColor}`,
            }
          : undefined
      }
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
        {getInitials(player.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{player.name}</p>
        <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
          <span aria-hidden="true">{player.countryFlag}</span>
          {player.country}
        </p>
      </div>
    </div>
  );
};
