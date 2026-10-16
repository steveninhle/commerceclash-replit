import { cn } from "@/lib/utils";

const STEPS = ["Choose Class", "Checkout", "Speak like CEO"] as const;
const NOTCH = 16;
const ACTIVE_GREEN = "#00CC93";

type CheckoutStepperProps = {
  currentStep: 0 | 1 | 2;
};

const stepClipPath = (index: number, total: number) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (isFirst) {
    return `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%)`;
  }
  if (isLast) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${NOTCH}px 50%)`;
  }
  return `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%, ${NOTCH}px 50%)`;
};

const StepBadge = ({
  index,
  isActive,
}: {
  index: number;
  isActive: boolean;
}) => (
  <span
    className={cn(
      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-[19px] sm:w-[19px] sm:text-[14px]",
      isActive ? "bg-white text-[#333333]" : "bg-[#E7E7E7] text-[#333333]",
    )}
  >
    {index + 1}
  </span>
);

type StepSegmentProps = {
  label: string;
  index: number;
  total: number;
  isActive: boolean;
};

const StepSegment = ({ label, index, total, isActive }: StepSegmentProps) => (
  <div
    aria-current={isActive ? "step" : undefined}
    style={{
      clipPath: stepClipPath(index, total),
      marginLeft: index === 0 ? 0 : -NOTCH,
      zIndex: total - index,
      backgroundColor: isActive ? ACTIVE_GREEN : "#FFFFFF",
    }}
    className="flex items-center justify-center gap-1 px-2 sm:gap-1.5 sm:px-4"
  >
    <StepBadge index={index} isActive={isActive} />

    <span
      className={cn(
        "sr-only truncate text-[15px] font-bold leading-none sm:not-sr-only",
        isActive ? "text-white" : "text-gray-900",
      )}
    >
      {label}
    </span>
  </div>
);

const StepConnector = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0"
    style={{ left: `calc(66.666% - ${NOTCH}px)` }}
    width={NOTCH}
    viewBox={`0 0 ${NOTCH} 100`}
    preserveAspectRatio="none"
  >
    <polyline
      points={`0,0 ${NOTCH},50 0,100`}
      fill="none"
      stroke="#9d9999"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <nav aria-label="Checkout progress" className="w-full py-6">
      <div className="mx-auto max-w-[1250px] min-[1700px]:max-w-[1400px] min-[1880px]:max-w-[1580px] min-[2200px]:max-w-[1800px] rounded-[20px] bg-white p-2 py-4 sm:p-3 sm:py-[26px]">
        <ol className="relative grid h-10 grid-cols-3 overflow-hidden rounded-full border border-[#E3E3E3] bg-white sm:!h-[51px]">
          <StepConnector />

          {STEPS.map((label, index) => (
            <StepSegment
              key={label}
              label={label}
              index={index}
              total={STEPS.length}
              isActive={index === currentStep}
            />
          ))}
        </ol>

        <p className="mt-2 text-center text-sm font-semibold text-gray-700 sm:hidden">
          Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep]}
        </p>
      </div>
    </nav>
  );
};

export { CheckoutStepper };
