type HeroSelectCardDividerProps = {
  /** Pre-rendered ornament image. Omit to render the generic themed line+diamond glyph. */
  asset?: string;
  className?: string;
};

// Generic ornamental divider — reused for the crest-and-line divider under
// the hero name, the thin glow line under the description, and the small
// underline in each perk's "unlocks at level" row, just by swapping which
// asset/className is passed in. Without an asset, falls back to a themed
// CSS glyph (line + rotated diamond) matching the source design's own reused
// vector ornament, so a hero never blocks on sourcing a bespoke crest image.
const HeroSelectCardDivider = ({ asset, className = "h-8 sm:h-10 w-auto" }: HeroSelectCardDividerProps) => {
  if (!asset) {
    return (
      <div className={`flex items-center justify-center ${className}`} role="presentation">
        <span className="h-px w-full bg-[var(--hs-primary)]/50" />
        <span className="mx-1.5 h-1.5 w-1.5 shrink-0 rotate-45 border border-[var(--hs-primary)]" />
        <span className="h-px w-full bg-[var(--hs-primary)]/50" />
      </div>
    );
  }

  return <img src={asset} alt="" role="presentation" className={className} />;
};

export { HeroSelectCardDivider };
