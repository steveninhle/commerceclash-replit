import type { CSSProperties } from "react";

// Shared page background for every step of the Choose Class -> Checkout
// funnel, so the gradient never drifts between steps.
export const CLASS_FLOW_BACKGROUND_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle at 0% 0%, #8BDFCE 0%, rgba(139, 223, 206, 0.65) 18%, rgba(220, 246, 234, 0.35) 48%, transparent 75%), " +
    "radial-gradient(circle at 100% 0%, #ADEABB 0%, rgba(173, 234, 187, 0.55) 25%, transparent 70%), " +
    "linear-gradient(180deg, #97E6E2 0%, #DCF6EA 50%, #EAFAFC 100%)",
};
