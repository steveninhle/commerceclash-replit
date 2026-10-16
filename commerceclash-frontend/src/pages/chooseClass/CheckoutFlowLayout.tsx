import type { ReactNode } from "react";
import { CheckoutStepper } from "./CheckoutStepper";
import { Header } from "./Header";
import { CLASS_FLOW_BACKGROUND_STYLE } from "./pageBackground";

type CheckoutFlowLayoutProps = {
  currentStep: 0 | 1 | 2;
  children: ReactNode;
  footer?: ReactNode;
};

const CheckoutFlowLayout = ({
  currentStep,
  children,
  footer,
}: CheckoutFlowLayoutProps) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <Header />

      <div
        id="class-options"
        className="w-full pb-16"
        style={CLASS_FLOW_BACKGROUND_STYLE}
      >
        <div className="mx-auto max-w-[1250px] min-[1700px]:max-w-[1400px] min-[1880px]:max-w-[1580px] min-[2200px]:max-w-[1800px] px-4 py-8 sm:px-6">
          <CheckoutStepper currentStep={currentStep} />
          {children}
        </div>
      </div>

      {footer}
    </div>
  );
};

export { CheckoutFlowLayout };
