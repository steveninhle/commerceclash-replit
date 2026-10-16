export const PokerChipX2 = () => (
  <svg className="relative z-10 h-7 w-7" viewBox="0 0 24 24" fill="none">
    <defs>
      <radialGradient id="chipGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#56FFD0" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#56FFD0" stopOpacity="0.05" />
      </radialGradient>

      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="#56FFD0"
      strokeWidth="2.2"
      filter="url(#glow)"
    />

    <g stroke="#56FFD0" strokeWidth="2">
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.5 4.5l2 2" />
      <path d="M17.5 17.5l2 2" />
      <path d="M4.5 19.5l2-2" />
      <path d="M17.5 6.5l2-2" />
    </g>

    <circle
      cx="12"
      cy="12"
      r="7"
      stroke="#56FFD0"
      strokeWidth="1.5"
      opacity="0.9"
    />

    <circle cx="12" cy="12" r="5.8" fill="url(#chipGradient)" />

    <text
      x="12"
      y="13"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="7.5"
      fontWeight="900"
      fill="#56FFD0"
      filter="url(#glow)"
      style={{ letterSpacing: "0.5px" }}
    >
      X2
    </text>
  </svg>
);
