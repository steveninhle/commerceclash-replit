import { motion } from "framer-motion";
import type { Leader } from "../types";

type Effect = "starlight" | "embers" | "orbit" | "gold" | "mist" | "scan";

interface EffectTheme {
  effect: Effect;
  accent: string;
}

const EFFECTS: Record<string, EffectTheme> = {
  visionary: { effect: "starlight", accent: "#93C5FD" },
  baron: { effect: "embers", accent: "#FDE68A" },
  diplomat: { effect: "orbit", accent: "#DDD6FE" },
  tycoon: { effect: "gold", accent: "#FDE68A" },
  explorer: { effect: "mist", accent: "#BBF7D0" },
  general: { effect: "scan", accent: "#BAE6FD" },
};

const PARTICLE_ANCHORS = Array.from({ length: 14 }, (_, index) => ({
  left: `${8 + ((index * 31) % 82)}%`,
  bottom: `${6 + ((index * 19) % 58)}%`,
  size: 3 + (index % 4) * 2,
  delay: index * 0.36,
}));

interface LeaderAtmosphereProps {
  leader: Leader;
}

/**
 * A small, composited ambient layer behind each portrait. The effect is keyed
 * by leader id so every CEO gets a distinct visual cue without new image files.
 */
export const LeaderAtmosphere = ({ leader }: LeaderAtmosphereProps) => {
  const theme = EFFECTS[leader.id] ?? { effect: "starlight", accent: leader.color };
  const isOrbit = theme.effect === "orbit" || theme.effect === "starlight";

  return (
    <motion.div
      key={leader.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <motion.div
        className="absolute inset-[12%_8%_3%] rounded-[50%] blur-2xl"
        style={{ background: `radial-gradient(ellipse, ${leader.color}55 0%, transparent 67%)` }}
        animate={{ opacity: [0.5, 0.95, 0.5], scale: [0.94, 1.07, 0.94] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {(theme.effect === "mist" || theme.effect === "embers") && (
        <>
          <motion.div
            className="absolute -bottom-3 -left-1/4 h-28 w-[75%] rounded-full blur-3xl"
            style={{ backgroundColor: `${theme.accent}44` }}
            animate={{ x: [-18, 34, -18], y: [8, -8, 8], scale: [0.88, 1.08, 0.88] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[17%] -right-1/4 h-20 w-[65%] rounded-full blur-3xl"
            style={{ backgroundColor: `${leader.color}3d` }}
            animate={{ x: [22, -24, 22], opacity: [0.25, 0.6, 0.25] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
        </>
      )}

      {isOrbit && (
        <>
          <div
            className="absolute left-1/2 top-[53%] h-[52%] w-[72%]"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <motion.div
              className="h-full w-full rounded-full border"
              style={{ borderColor: `${theme.accent}99`, boxShadow: `0 0 22px ${leader.color}66` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div
            className="absolute left-1/2 top-[53%] h-[35%] w-[49%]"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <motion.div
              className="h-full w-full rounded-full border border-dashed"
              style={{ borderColor: `${leader.color}aa` }}
              animate={{ rotate: -360 }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </>
      )}

      {theme.effect === "scan" && (
        <>
          <div
            className="absolute inset-x-[5%] bottom-0 top-[20%] opacity-40 [background-size:32px_32px]"
            style={{
              backgroundImage: `linear-gradient(${theme.accent}55 1px, transparent 1px), linear-gradient(90deg, ${theme.accent}55 1px, transparent 1px)`,
              maskImage: "linear-gradient(to top, black, transparent 90%)",
              transform: "perspective(460px) rotateX(58deg)",
              transformOrigin: "bottom",
            }}
          />
          <motion.div
            className="absolute inset-x-[5%] h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`, boxShadow: `0 0 18px ${theme.accent}` }}
            animate={{ top: ["28%", "88%", "28%"], opacity: [0, 0.9, 0] }}
            transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {theme.effect === "gold" && (
        <motion.div
          className="absolute inset-0 opacity-50"
          style={{ background: `linear-gradient(110deg, transparent 30%, ${theme.accent}2b 46%, transparent 58%)` }}
          animate={{ x: ["-80%", "110%"] }}
          transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        />
      )}

      {PARTICLE_ANCHORS.map((particle, index) => {
        const isEmber = theme.effect === "embers";
        const isSparkle = theme.effect === "gold" || theme.effect === "starlight";
        return (
          <motion.span
            key={`${leader.id}-${index}`}
            className="absolute rounded-full"
            style={{
              left: particle.left,
              bottom: particle.bottom,
              width: particle.size,
              height: particle.size,
              background: theme.accent,
              boxShadow: `0 0 10px ${leader.color}, 0 0 16px ${theme.accent}`,
            }}
            animate={
              isSparkle
                ? { opacity: [0.08, 1, 0.08], scale: [0.45, 1.35, 0.45] }
                : { opacity: [0, 0.95, 0], y: [18, -220], x: [0, isEmber ? 34 : 16], rotate: isEmber ? [0, 150] : 0, scale: [0.55, 1.15] }
            }
            transition={{
              duration: isSparkle ? 2.3 + (index % 3) * 0.45 : 4.8 + (index % 4) * 0.55,
              delay: particle.delay,
              repeat: Infinity,
              ease: isSparkle ? "easeInOut" : "linear",
            }}
          />
        );
      })}
    </motion.div>
  );
};
