import { cn } from "@/lib/utils";

interface VectorProps {
  className?: string;
}

export const Vector = ({ className }: VectorProps) => (
  <svg
    viewBox="0 0 381 335"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("w-full h-full", className)}
    preserveAspectRatio="xMidYMid meet"
  >
    <g filter="url(#filter0_i_5_176)">
      <path
        d="M377.975 165.711L285.516 2.51186L97.9513 4.03904L2.87999 168.707L95.3396 331.906L282.904 330.379L377.975 165.711Z"
        stroke="url(#paint0_linear_5_176)"
        strokeOpacity="0.8"
        strokeWidth="5"
        strokeMiterlimit="10"
      />
    </g>

    <defs>
      <filter
        id="filter0_i_5_176"
        x="0"
        y="0"
        width="380.855"
        height="338.418"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend in2="shape" result="effect1_innerShadow_5_176" />
      </filter>

      <linearGradient
        id="paint0_linear_5_176"
        x1="285.516"
        y1="2.51187"
        x2="95.3396"
        y2="331.906"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#55FBCD" />
        <stop offset="1" stopColor="#55FBCD" />
      </linearGradient>
    </defs>
  </svg>
);
