import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StateMessageProps = {
  icon: LucideIcon;
  tone?: "default" | "danger";
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

const StateMessage = ({
  icon: Icon,
  tone = "default",
  title,
  description,
  action,
  className,
}: StateMessageProps) => (
  <div
    className={cn(
      "flex animate-in flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 text-center duration-300 fade-in sm:py-16",
      className,
    )}
  >
    <span
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full",
        tone === "danger" ? "bg-red-50" : "bg-[#F3F5F4]",
      )}
    >
      <Icon
        className={cn("h-6 w-6", tone === "danger" ? "text-red-500" : "text-green-600")}
        aria-hidden="true"
      />
    </span>
    <div>
      <p className="font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
    {action}
  </div>
);

export { StateMessage };
