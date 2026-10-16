import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

// The plain white rounded-2xl surface repeated across the Choose Class ->
// Checkout funnel (page section wrappers, the Sidebar, the two Checkout
// panels, and ClassOptionCard's outer shell). `bordered` opts into the
// hairline border ClassOptionCard uses instead of the borderless surface the
// other panels use — a real semantic difference (interactive/selectable card
// vs. static content panel), not an accidental one, so both stay available
// rather than being collapsed into one look.
type CardOwnProps = {
  bordered?: boolean;
  padded?: boolean;
};

type CardProps<T extends ElementType> = CardOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | "as"> & {
    as?: T;
  };

const CardStripe = <T extends ElementType = "div">({
  as,
  bordered = false,
  padded = true,
  className,
  ...props
}: CardProps<T>) => {
  const Component = as ?? "div";
  return (
    <Component
      className={cn(
        "rounded-2xl bg-white",
        padded && "!p-5",
        bordered && "border border-[#E1E1E1]",
        className,
      )}
      {...props}
    />
  );
};

export { CardStripe };
