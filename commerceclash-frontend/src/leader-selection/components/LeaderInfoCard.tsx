import { AnimatePresence, motion } from "framer-motion";
import type { Leader } from "../types";
import { ConfirmButton } from "./ConfirmButton";

interface LeaderInfoCardProps {
  leader: Leader;
  onConfirm: () => void;
}

/** Name, emblem, tagline, description and the confirm CTA for the selected leader. */
export const LeaderInfoCard = ({ leader, onConfirm }: LeaderInfoCardProps) => {
  const emblemIcon = leader.perks[0]?.icon;
  const Emblem = emblemIcon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={leader.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left"
      >
        <h2 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-extrabold uppercase leading-none tracking-wide text-transparent sm:text-4xl">
          {leader.name}
        </h2>

        {Emblem && (
          <span
            className="flex size-16 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `${leader.color}1a`,
              borderColor: `${leader.color}40`,
              color: leader.color,
              boxShadow: `0 0 20px -6px ${leader.color}`,
            }}
          >
            <Emblem className="size-8" aria-hidden="true" />
          </span>
        )}

        <p
          className="text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color: leader.color }}
        >
          {leader.title}
        </p>

        <div
          aria-hidden="true"
          className="h-px w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <p className="max-w-md text-sm leading-relaxed text-white/50">
          {leader.description}
        </p>

        <div className="w-full max-w-xs lg:max-w-none">
          <ConfirmButton onConfirm={onConfirm} label="Confirm CEO" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
