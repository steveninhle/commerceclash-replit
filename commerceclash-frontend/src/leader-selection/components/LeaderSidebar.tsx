import type { SeatedPlayer } from "../types";
import { PlayerSeat } from "./PlayerSeat";
import { SeatCounter } from "./SeatCounter";

interface LeaderSidebarProps {
  players: SeatedPlayer[];
  totalSeats: number;
  selectedColor: string;
}

/** Lobby roster: filled seats first, then empty placeholders up to totalSeats. */
export const LeaderSidebar = ({ players, totalSeats, selectedColor }: LeaderSidebarProps) => {
  const emptySeats = Math.max(0, totalSeats - players.length);

  return (
    <aside
      aria-label="Lobby players"
      className="flex w-full flex-col gap-3 rounded-2xl border border-amber-200/10 bg-white/[0.02] p-4"
    >
      <SeatCounter filled={players.length} total={totalSeats} />
      <div className="flex flex-col gap-2">
        {players.map((player) => (
          <PlayerSeat key={player.id} player={player} accentColor={selectedColor} />
        ))}
        {Array.from({ length: emptySeats }).map((_, index) => (
          <PlayerSeat key={`empty-${index}`} />
        ))}
      </div>
    </aside>
  );
};
