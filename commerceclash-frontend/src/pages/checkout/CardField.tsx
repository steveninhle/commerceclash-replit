import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardFieldProps = {
  label: string;
  focused: boolean;
  error?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export const CardField = ({
  label,
  focused,
  error,
  children,
  rightSlot,
}: CardFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-normal text-gray-900">
      {label} <span className="text-red-500">*</span>
    </span>
    <div
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-full border bg-[#f0f1f3] px-5 transition-all",
        error
          ? "border-red-300 bg-red-50"
          : focused
            ? "border-emerald-400 bg-white ring-1 ring-emerald-400/30"
            : "border-transparent",
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {rightSlot}
    </div>
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const badgeClass =
  "flex h-6 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-white";

const VisaMark = () => (
  <span className={badgeClass}>
    <span className="text-[11px] font-black tracking-tight text-[#1A1F71] italic">
      VISA
    </span>
  </span>
);

const MastercardMark = () => (
  <span className={badgeClass}>
    <span className="flex items-center" aria-hidden="true">
      <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
      <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
    </span>
  </span>
);

const AmexMark = () => (
  <span className={cn(badgeClass, "bg-[#2E77BC]")}>
    <span className="text-[8px] font-black tracking-tight text-white">
      AMEX
    </span>
  </span>
);

export const PaymentMethodIcons = () => (
  <div className="flex shrink-0 items-center gap-1.5">
    <VisaMark />
    <MastercardMark />
    <AmexMark />
  </div>
);
