import { SkillBadgeProps } from "./types";

export const SkillBadge = ({
  icon,
  text,
  number,
  className = "",
  starSize = 1,
}: SkillBadgeProps) => {
  // Function to generate a star at a specific position
  const generateStar = (
    x: number,
    y: number,
    filterId: string,
    active: boolean,
    size: number = 1,
  ) => (
    <g
      key={`star-${x}-${y}`}
      filter={filterId}
      transform={`scale(${size}) translate(${(x * (1 - size)) / size}, ${(y * (1 - size)) / size})`}
    >
      <path
        d={`M${x} ${y}L${x + 1.5 * size} ${y + 3 * size}L${x + 4.8 * size} ${y + 3.5 * size}L${x + 2.4 * size} ${
          y + 5.9 * size
        }L${x + 3 * size} ${y + 9.2 * size}L${x} ${y + 7.6 * size}L${x - 3 * size} ${y + 9.2 * size}L${x - 2.4 * size} ${
          y + 5.9 * size
        }L${x - 4.8 * size} ${y + 3.5 * size}L${x - 1.5 * size} ${y + 3 * size}L${x} ${y}Z`}
        fill={active ? "url(#starGoldGradient)" : "#A6A6A6"}
      />
    </g>
  );

  // Generate stars based on the number prop
  const generateStars = () => {
    const stars = [];
    const positions = [
      { x: 39.537, y: 86.215, filterId: "url(#filter5_di_1_35)" },
      { x: 44.537, y: 95.215, filterId: "url(#filter4_di_1_35)" },
      { x: 54.537, y: 101.215, filterId: "url(#filter11_di_1_35)" },
      { x: 67.537, y: 101.215, filterId: "url(#filter9_di_1_35)" },
      { x: 81.0448, y: 101.215, filterId: "url(#filter6_di_1_35)" },
      { x: 94.537, y: 101.215, filterId: "url(#filter7_di_1_35)" },
      { x: 104.537, y: 95.215, filterId: "url(#filter8_di_1_35)" },
      { x: 109.537, y: 86.215, filterId: "url(#filter10_di_1_35)" },
    ];

    for (let i = 0; i < positions.length; i++) {
      stars.push(
        generateStar(
          positions[i].x,
          positions[i].y,
          positions[i].filterId,
          i < number,
          starSize,
        ),
      );
    }

    return stars;
  };

  return (
    <svg
      width={149}
      height={131}
      viewBox="0 0 149 131"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width: "100%",
        height: "auto",
        maxWidth: "149px",
      }}
    >
      <g filter="url(#filter0_d_1_35)">
        <path
          d="M141.889 61.6997L131.834 44.3536L128.865 42.8151L118.338 25.1954L119.338 21.5L108.023 3.2631L88.2248 3.2325L85.9735 5.4698L60.4105 5.5764L57.1372 3.1847L40.5005 3.1631L29.831 21.6433L30.3951 25.1954L20.2224 42.8151L16.7192 44.3536L6.8362 61.4715L16.6439 78.391L19.9947 79.775L29.8575 98.136L30.328 102.017L40.684 119.898L60.1475 119.926L63.1609 117.699L86.2133 117.744L89.4123 119.973L108.224 120.008L117.404 104.109L116.859 100.233L128.691 79.198L132.699 77.617L141.889 61.6997Z"
          fill="url(#paint0_linear_1_35)"
          stroke="url(#paint1_linear_1_35)"
          strokeWidth={2.5}
          strokeMiterlimit={10}
          preserveAspectRatio="xMidYMid meet"
        />
        <g filter="url(#filter1_i_1_35)">
          <path
            d="M104.985 112.361L134.644 61.0647L104.376 10.1784L44.4495 10.5351L14.8438 61.7779L45.0578 112.718L104.985 112.361Z"
            fill="url(#paint2_linear_1_35)"
          />
          <path
            d="M104.985 112.361L134.644 61.0647L104.376 10.1784L44.4495 10.5351L14.8438 61.7779L45.0578 112.718L104.985 112.361Z"
            fill="url(#paint3_linear_1_35)"
          />
        </g>
        <path
          d="M51.8379 99.215H97.838L108.838 80.215H122.838L104.816 112.215H45.8379L26.3379 79.215H40.1162L51.8379 99.215Z"
          fill="black"
          fillOpacity={0.8}
        />
        <g filter="url(#filter2_i_1_35)">
          <path
            d="M104.696 111.863L45.3423 112.216L15.4233 61.7733L44.7389 11.0334L104.093 10.6801L134.065 61.068L104.696 111.863Z"
            stroke="url(#paint4_linear_1_35)"
          />
        </g>
        <g filter="url(#filter3_d_1_35)">
          <path
            d="M97.842 100.451L120.573 61.137L97.375 22.1367L51.4461 22.4101L28.7558 61.6836L51.9124 100.725L97.842 100.451Z"
            fill="url(#paint5_linear_1_35)"
          />
        </g>
        {generateStars()}
      </g>

      {/* Display icon component */}
      <foreignObject x="50" y="35" width="48" height="43">
        <div className="flex items-center justify-center w-full h-full">
          {icon}
        </div>
      </foreignObject>

      {/* Display test content */}
      <foreignObject x="45" y="80" width="60" height="50">
        <div className="skill-badge-text">{text}</div>
      </foreignObject>

      <defs>
        <linearGradient id="starGoldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD350" />
          <stop offset="100%" stopColor="#765C00" />
        </linearGradient>
        <filter
          id="filter0_d_1_35"
          x={0.392101}
          y={0.912163}
          width={147.941}
          height={129.347}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={2.5} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_i_1_35"
          x={14.8438}
          y={10.1784}
          width={119.8}
          height={106.54}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter2_i_1_35"
          x={14.8439}
          y={10.1784}
          width={119.801}
          height={106.539}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect1_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter3_d_1_35"
          x={24.7558}
          y={22.1367}
          width={99.8172}
          height={86.5883}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
        </filter>
        <filter
          id="filter4_di_1_35"
          x={39.4889}
          y={95.215}
          width={10.1962}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter5_di_1_35"
          x={34.4889}
          y={86.215}
          width={10.1962}
          height={9.921}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter6_di_1_35"
          x={75.9968}
          y={101.215}
          width={10.1961}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter7_di_1_35"
          x={89.4889}
          y={101.215}
          width={10.1961}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter8_di_1_35"
          x={99.489}
          y={95.215}
          width={10.196}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter9_di_1_35"
          x={62.4889}
          y={101.215}
          width={10.1962}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter10_di_1_35"
          x={104.489}
          y={86.215}
          width={10.196}
          height={9.921}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <filter
          id="filter11_di_1_35"
          x={49.4889}
          y={101.215}
          width={10.1962}
          height={9.92101}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={0.5} />
          <feGaussianBlur stdDeviation={0.1} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1_35"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1_35"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx={0.3} dy={0.3} />
          <feGaussianBlur stdDeviation={0.25} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_1_35"
          />
        </filter>
        <linearGradient
          id="paint0_linear_1_35"
          x1={108.032}
          y1={3.2683}
          x2={40.693}
          y2={119.903}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D9D9D9" />
          <stop offset={1} stopColor="#737373" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1_35"
          x1={39.5816}
          y1={-1.4781}
          x2={104.131}
          y2={110.756}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#19A486" />
          <stop offset={1} stopColor="#25B695" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_1_35"
          x1={88.1412}
          y1={2.2139}
          x2={94.715}
          y2={82.626}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#19A486" />
          <stop offset={1} stopColor="#07B67F" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_1_35"
          x1={74.4398}
          y1={10.3566}
          x2={75.0481}
          y2={112.539}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#55FBCD" />
          <stop offset={1} stopColor="#55FBCD" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_1_35"
          x1={74.4398}
          y1={10.3566}
          x2={75.0481}
          y2={112.539}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0.447115} stopColor="#56FFD0" />
          <stop offset={1} stopColor="#27A08A" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_1_35"
          x1={97.375}
          y1={22.1367}
          x2={75.7197}
          y2={107.265}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ABABAB" />
          <stop offset={0.75} stopColor="#4C4C4C" />
        </linearGradient>
      </defs>
    </svg>
  );
};
