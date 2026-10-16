import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const PILL_BUTTON_CLASS =
  "!m-0 flex !h-14 w-full !items-center !justify-center gap-2 !rounded-full !p-0 !text-lg !font-bold transition-transform disabled:!cursor-not-allowed disabled:!bg-gray-200 disabled:!text-gray-400 enabled:!bg-gradient-to-r enabled:!from-[#7BFFD8] enabled:!to-[#93FF74] enabled:!text-black enabled:hover:scale-[1.01]";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const PillButton = ({
  className,
  type = "button",
  ...props
}: PillButtonProps) => (
  <button type={type} className={cn(PILL_BUTTON_CLASS, className)} {...props} />
);

export { PillButton };
