import { Users } from "lucide-react";

interface SeatCounterProps {
  filled: number;
  total: number;
}

/** "SEATS FILLED: x/y" header row for the lobby sidebar. */
export const SeatCounter = ({ filled, total }: SeatCounterProps) => {
  return (
    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.15em] text-white/60">
      <span>
        Seats Filled: {filled}/{total}
      </span>
      <Users className="size-4 text-white/40" aria-hidden="true" />
    </div>
  );
};
