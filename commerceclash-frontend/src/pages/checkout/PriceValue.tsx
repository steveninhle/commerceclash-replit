import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceStatus } from "./types";

type PriceValueProps = {
  status: PriceStatus;
  label: string;

  onRetry?: () => void;
  className?: string;
};

export const PriceValue = ({
  status,
  label,
  onRetry,
  className,
}: PriceValueProps) => {
  if (status === "loading") {
    return (
      <span
        className={cn(
          "inline-block h-4 w-16 animate-pulse rounded bg-gray-200",
          className,
        )}
        aria-hidden="true"
      />
    );
  }
  if (status === "error" && onRetry) {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    );
  }
  return <span className={className}>{label}</span>;
};
