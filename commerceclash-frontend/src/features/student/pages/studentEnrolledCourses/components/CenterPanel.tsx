import { images } from "@/assets";
import { EnrolledCourse } from "@/components/types";
import LoadingOverlay from "@/components/ui/loading-overplay";
import ProgressBar from "@/components/ui/ProgressBar";
import { Character } from "@/transformers/types";
import { CharacterAssets, studentCeoAssets } from "@/utils/helper";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

function formatClassTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function useClassTimer(nextClassIso: string | null) {
  const calc = () => {
    if (!nextClassIso)
      return { ms: null as number | null, countdown: null as string | null };
    const ms = new Date(nextClassIso).getTime() - Date.now();
    if (ms <= 0) return { ms: 0, countdown: null };
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return {
      ms,
      countdown: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    if (!nextClassIso) {
      setState({ ms: null, countdown: null });
      return;
    }
    setState(calc());
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextClassIso]);
  return state;
}

// ── CENTER PANEL ─────────────────────────────────────────────────────────────
interface CenterPanelProps {
  course: EnrolledCourse | null;
  character: Character | null;
  assets: CharacterAssets | null;
  nextClassIso: string | null;
  myRank: number | null;
  myMarketShare: number | null;
  isLoading: boolean;
  onJoin: (c: EnrolledCourse) => void;
  onDelete: (id: string) => void;
  ceoLoading: boolean;
  studentName?: string;
}

export function CenterPanel({
  course,
  character,
  assets,
  nextClassIso,
  onJoin,
  ceoLoading,
  studentName,
}: CenterPanelProps) {
  const { ms, countdown } = useClassTimer(nextClassIso);
  const showCountdown = ms !== null && ms > 0 && ms <= 10 * 60 * 1000;

  const heroImg = assets?.imageSrc;
  const displayName = studentName?.toUpperCase() ?? "STUDENT";

  const borderClass = assets?.border ?? studentCeoAssets(null).border;

  return (
    <div
      className={`relative h-full flex flex-col w-full xl:w-1/3 rounded-md overflow-hidden border ${borderClass}`}
    >
      {/* Hero image — fills entire panel */}
      {ceoLoading || !heroImg ? (
        <LoadingOverlay size={8} className="h-full" />
      ) : (
        <div className="relative h-full w-full">
          <img
            src={heroImg}
            alt={assets?.imageAlt ?? "hero"}
            className="absolute inset-0 w-full h-auto min-h-full object-cover"
          />
          {/* Top scrim — keeps the welcome header legible over the portrait */}
          <div className="absolute inset-x-0 top-0 z-10 h-1/3 bg-gradient-to-b from-black/85 via-black/30 to-transparent" />
        </div>
      )}

      {/* Welcome header — sits over the top of the portrait */}
      <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-6 pt-5 gap-0.5">
        <span className="font-gothic-condensed text-metal-gradient text-lg tracking-widest uppercase">
          Welcome back,
        </span>
        <span
          className="font-gothic-condensed text-2xl tracking-widest uppercase"
          style={
            {
              "--glow-color": assets?.color ?? "#ff0000",
            } as React.CSSProperties
          }
        >
          <span className="text-accent-glow text-4xl font-black">
            {displayName}!
          </span>
        </span>
      </div>

      {/* Info block — sits on top of gradient */}
      <div className="absolute inset-x-0 bottom-5 z-20 flex flex-col items-center px-6 pb-4 gap-1.5">
        {character && (
          <div className="w-full max-w-[400px]">
            <ProgressBar
              xpProgress={character.xp}
              levelProgress={character.level}
              accentColor={assets?.color}
              characterTitle={character.title}
              showXpLabel
            />
          </div>
        )}

        {course && (
          <button
            disabled={
              !course.status ||
              (course.start_time != null &&
                new Date(course.start_time) > new Date())
            }
            onClick={() => onJoin(course)}
            className="group relative max-w-[400px] w-full aspect-425/99 mt-1 font-black text-sm tracking-widest uppercase rounded-sm overflow-hidden transition-transform duration-200 ease-out hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 not-disabled:animate-[cta-pulse_2s_ease-in-out_infinite] justify-center items-center"
          >
            <img
              src={assets?.joinButtonSrc ?? images.btnJoinClassBaron}
              alt=""
              className="absolute inset-0 w-full h-full transition-[filter] duration-200 ease-out group-hover:brightness-110 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.55)]"
            />
            {!course.status ||
            (course.start_time != null &&
              new Date(course.start_time) > new Date()) ? null : (
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.65)_50%,transparent_60%)] bg-[length:250%_100%] mix-blend-overlay animate-[shine_2.2s_linear_infinite] w-[calc(100%-60px)] h-[calc(100%-20px)] rounded-lg"
              />
            )}
          </button>
        )}

        <div className="pt-0.5 flex flex-col items-center gap-0.5 text-center">
          {!nextClassIso ? (
            <p className="text-white text-xs tracking-widest uppercase">
              No schedule set
            </p>
          ) : ms !== null && ms > 0 ? (
            showCountdown ? (
              <p className="flex items-center gap-1.5 text-white text-xs tracking-widest">
                <Calendar
                  className="h-3.5 w-3.5"
                  style={{ color: assets?.color ?? "#56FFD0" }}
                />
                Starts in:{" "}
                <span
                  className="font-bold text-sm"
                  style={{
                    color: assets?.color ?? "#56FFD0",
                    textShadow: `0 0 10px ${assets?.color ?? "#56FFD0"}`,
                  }}
                >
                  {countdown}
                </span>
              </p>
            ) : (
              <>
                <p className="flex items-center gap-1.5 text-gray-300 text-[10px] tracking-widest uppercase">
                  <Calendar className="h-3 w-3" />
                  Next class
                </p>
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: assets?.color ?? "#56FFD0" }}
                >
                  {formatClassTime(nextClassIso)}
                </p>
              </>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
