import { images } from "@/assets";
import { get } from "@/api";
import { END_POINTS } from "@/api/endpoints";
import { HEROES, defaultCategories } from "@/features/game/constants";
import { cn } from "@/lib/utils";
import { CharacterAssets, studentCeoAssets } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MAX_SKILL = 8;
const PROGRESS_SEGMENTS = 8;

const CATEGORY_COLOR: Record<
  string,
  { from: string; to: string; diamond: string; icon: string }
> = {
  Quality: {
    from: "#ff0000",
    to: "#990000",
    diamond: images.diamondRed,
    icon: images.investmentQuality,
  },
  Team: {
    from: "#45b9d0",
    to: "#235e6a",
    diamond: images.diamondBlue,
    icon: images.investmentTeam,
  },
  Marketing: {
    from: "#8c00ff",
    to: "#540099",
    diamond: images.diamondPurple,
    icon: images.investmentMarketing,
  },
  Logistics: {
    from: "#08af49",
    to: "#03491e",
    diamond: images.diamondGreen,
    icon: images.investmentLogistics,
  },
  Innovation: {
    from: "#fe9200",
    to: "#985700",
    diamond: images.diamondYellow,
    icon: images.investmentInnovation,
  },
};

// Display order for the investment-distribution rows (independent of defaultCategories'
// declared order, which drives the unrelated skill-wheel layout in ReadonlySkillView).
const ROW_ORDER = ["Quality", "Team", "Marketing", "Logistics", "Innovation"];

type SkillsRaw = {
  skills: { id: string; name: string; value: number }[];
};

function SectionHeading({
  text,
  size,
}: {
  text: string;
  size: "3xl" | "lg" | "sm";
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="h-px max-w-10 flex-1 bg-gradient-to-r from-transparent to-red-600" />
      <span
        className={cn(
          "font-gothic-condensed whitespace-nowrap uppercase tracking-[0.15em]",
          size === "3xl"
            ? "text-flame-gradient text-3xl"
            : "text-metal-gradient text-lg",
        )}
      >
        {text}
      </span>
      <span className="h-px max-w-10 flex-1 bg-gradient-to-l from-transparent to-red-600" />
    </div>
  );
}

// ── RIGHT PANEL ──────────────────────────────────────────────────────────────
export function RightPanel({
  assets,
  courseId,
  studentId,
  activeCeoTitle,
}: {
  assets: CharacterAssets | null;
  courseId: string | null;
  studentId: string;
  activeCeoTitle?: string | null;
}) {
  const borderClass = assets?.border ?? studentCeoAssets(null).border;
  const [selectedCategory, setSelectedCategory] = useState(
    defaultCategories[defaultCategories.length - 1].key,
  );

  const orderedHeroes = useMemo(() => {
    if (!activeCeoTitle) return HEROES;
    const index = HEROES.findIndex(
      (h) => h.title.toUpperCase() === activeCeoTitle.toUpperCase(),
    );
    if (index <= 0) return HEROES;
    const heroes = [...HEROES];
    const [currentCeo] = heroes.splice(index, 1);
    heroes.unshift(currentCeo);
    return heroes;
  }, [activeCeoTitle]);

  const [activeHeroId, setActiveHeroId] = useState(orderedHeroes[0]?.id);
  const VISIBLE_HERO_COUNT = 5;
  const [heroWindowStart, setHeroWindowStart] = useState(0);
  const visibleHeroes = orderedHeroes.slice(
    heroWindowStart,
    heroWindowStart + VISIBLE_HERO_COUNT,
  );

  useEffect(() => {
    if (activeCeoTitle) {
      setActiveHeroId(orderedHeroes[0]?.id);
      setHeroWindowStart(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCeoTitle]);

  const shiftActiveHero = (direction: "left" | "right") => {
    const activeIndex = orderedHeroes.findIndex((h) => h.id === activeHeroId);
    const nextIndex = Math.max(
      0,
      Math.min(activeIndex + (direction === "left" ? -1 : 1), orderedHeroes.length - 1),
    );
    setActiveHeroId(orderedHeroes[nextIndex]?.id);
    setHeroWindowStart((prev) => {
      if (nextIndex < prev) return nextIndex;
      if (nextIndex > prev + VISIBLE_HERO_COUNT - 1)
        return nextIndex - VISIBLE_HERO_COUNT + 1;
      return prev;
    });
  };

  const { data } = useQuery<SkillsRaw>({
    queryKey: ["skills", studentId, courseId],
    queryFn: async () => {
      const res = await get(
        END_POINTS.GET_SKILLS.replace("{sid}", studentId).replace(
          "{cid}",
          courseId!,
        ),
      );
      return res.data as SkillsRaw;
    },
    enabled: !!studentId && !!courseId,
  });

  const investedByKey = Object.fromEntries(
    (data?.skills ?? []).map((s, i) => [
      defaultCategories.find((c) => c.key === s.id)?.key ??
        defaultCategories[i]?.key,
      s.value,
    ]),
  );

  const orderedCategories = [...defaultCategories].sort(
    (a, b) => ROW_ORDER.indexOf(a.label) - ROW_ORDER.indexOf(b.label),
  );

  return (
    <div
      className={`h-full flex flex-col px-3 pt-3 pb-2 gap-y-3 md:bg-black/50 bg-back-800 w-full xl:w-1/3 rounded-md overflow-hidden border ${borderClass}`}
    >
      <SectionHeading text="Skill Investments" size="3xl" />

      {/* Investment Opportunities — hero carousel */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => shiftActiveHero("left")}
            disabled={orderedHeroes.findIndex((h) => h.id === activeHeroId) <= 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-white/60"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-end justify-center px-5 py-2">
            {visibleHeroes.map((hero, i) => {
              const isActive = activeHeroId === hero.id;
              return (
                <button
                  key={hero.id}
                  onClick={() => setActiveHeroId(hero.id)}
                  style={{
                    zIndex: isActive
                      ? visibleHeroes.length + 1
                      : visibleHeroes.length - i,
                    boxShadow: isActive
                      ? `0 0 4px 2px ${assets?.color ?? "#ffffff"}`
                      : undefined,
                    borderColor: assets?.color,
                  }}
                  className={cn(
                    "relative min-w-0 flex-1 max-w-35 aspect-20/41 origin-bottom overflow-hidden rounded-md border-2 text-left transition-all duration-300",
                    i > 0 && "-ml-2",
                    isActive ? "scale-105" : "brightness-75",
                  )}
                >
                  <img
                    src={hero.imageSrc}
                    alt={hero.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-4 pb-1">
                    <p className="truncate text-center text-[9px] font-black uppercase text-white">
                      {hero.title.replace(/^THE\s+/i, "")}
                    </p>
                  </div>
                  {isActive && (
                    <span
                      style={{backgroundColor: assets?.color ?? "#ffffff"}}
                      className={`absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 z-10`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => shiftActiveHero("right")}
            disabled={
              orderedHeroes.findIndex((h) => h.id === activeHeroId) >=
              orderedHeroes.length - 1
            }
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-white/60"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <SectionHeading text="Current Investment Distribution" size="sm" />

      {/* Category investment rows */}
      <div className="flex flex-col gap-4">
        {orderedCategories.map(({ key, label }) => {
          const accent = CATEGORY_COLOR[label] ?? CATEGORY_COLOR.Marketing;
          const invested = investedByKey[key] ?? 0;
          const isActive = selectedCategory === key;
          const filledSegments = Math.round(
            (invested / MAX_SKILL) * PROGRESS_SEGMENTS,
          );

          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className="flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-shadow"
              style={{
                borderColor: accent.from,
                background: `linear-gradient(90deg, color-mix(in srgb, ${accent.from} 22%, black) 0%, black 65%)`,
                boxShadow: isActive
                  ? `inset 0 0 14px color-mix(in srgb, ${accent.from} 55%, transparent), 0 0 10px color-mix(in srgb, ${accent.from} 35%, transparent)`
                  : "inset 2px 2px 6px rgba(255,255,255,0.12), inset -3px -3px 10px rgba(0,0,0,0.4)",
              }}
            >
              <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
                <img
                  src={accent.diamond}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
                <img
                  src={accent.icon}
                  alt={label}
                  className="relative h-4 w-4"
                />
              </span>

              <span className="font-gothic-condensed text-metal-gradient flex-shrink-0 text-xs font-bold uppercase tracking-wide">
                {label}
              </span>

              <span className="flex flex-1 items-center gap-2 justify-center justify-center">
                {Array.from({ length: PROGRESS_SEGMENTS }).map((_, i) => (
                  <span
                    key={i}
                    className="h-10 w-3 xl:w-4 min-[1401px]:w-6 skew-x-[-20deg] rounded-[2px] border"
                    style={
                      i < filledSegments
                        ? {
                            borderColor: accent.from,
                            background: `linear-gradient(180deg, ${accent.from}, ${accent.to})`,
                            boxShadow:
                              "inset 2px 2px 3px rgba(255,255,255,0.4), inset -2px -3px 4px rgba(0,0,0,0.5)",
                          }
                        : {
                            borderColor: `color-mix(in srgb, ${accent.from} 50%, transparent)`,
                          }
                    }
                  />
                ))}
              </span>

              <span className="font-gothic-condensed flex-shrink-0 text-sm font-bold">
                <span style={{ color: accent.from }}>{invested}</span>
                <span className="text-gray-300">/{MAX_SKILL}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Upgrade roadmap — reserved space */}
      <div className="flex-1" />
    </div>
  );
}
