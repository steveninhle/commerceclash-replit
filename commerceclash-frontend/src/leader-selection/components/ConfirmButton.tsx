import { motion } from "framer-motion";

interface ConfirmButtonProps {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

/** Outlined, glowing primary CTA — the one action every screen builds toward. */
export const ConfirmButton = ({ label = "Confirm CEO", onConfirm, disabled }: ConfirmButtonProps) => {
  return (
    <motion.button
      type="button"
      onClick={onConfirm}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="min-h-11 w-full rounded-lg border-2 border-blue-400/70 bg-blue-500/10 px-6 py-3.5
        text-sm font-bold uppercase tracking-[0.2em] text-blue-100
        shadow-[0_0_20px_-5px_rgba(59,130,246,0.6)]
        transition-[background-color,box-shadow] duration-200
        hover:bg-blue-500/20 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.85)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816]
        disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </motion.button>
  );
};
