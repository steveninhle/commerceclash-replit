import { images } from "@/assets";
import { isPerkAvailableAtLevel, requiredPerkLevel } from "@/features/game/utils/perkState";
import { LeaderboardStudent } from "@/features/game/hooks/useLeaderboard";
import { cn } from "@/lib/utils";
import { Character } from "@/transformers/types";
import {
  CharacterAssets,
  CharacterName,
  leaderboardCeoImage,
  rankIconCeoImage,
  studentCeoAssets,
} from "@/utils/helper";
import { CheckCircle2, Lock } from "lucide-react";

// ── Leaderboard ──
const PODIUM_RANK_STYLE: Record<
  number,
  {
    border: string;
    color: string;
    frameImg: string;
    rankImg: string;
    rankImgSize: string;
    star: string;
  }
> = {
  1: {
    border: "border-[#f5c518]",
    color: "#f5c518",
    frameImg: images?.frame1,
    rankImg: images?.rank1,
    rankImgSize: "w-12",
    star: "text-[#f5c518]",
  },
  2: {
    border: "border-[#c8c8c8]",
    color: "#c8c8c8",
    frameImg: images?.frame2,
    rankImg: images?.rank2,
    rankImgSize: "w-8",
    star: "text-[#c8c8c8]",
  },
  3: {
    border: "border-[#cd7f32]",
    color: "#cd7f32",
    frameImg: images?.frame3,
    rankImg: images?.rank3,
    rankImgSize: "w-8",
    star: "text-[#cd7f32]",
  },
};

function PodiumCard({
  student,
  rank,
  loading,
}: {
  student?: LeaderboardStudent;
  rank: number;
  loading?: boolean;
}) {
  const style = PODIUM_RANK_STYLE[rank];
  const isFirst = rank === 1;
  const isOpen = !student;
  const isSkeleton = isOpen && loading;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-start items-start",
        isFirst
          ? "flex-[1.1] max-w-[144px] -translate-y-2"
          : "flex-1 max-w-[126px]",
      )}
    >
      <img
        src={style.rankImg}
        alt={`Rank ${rank}`}
        className={cn(
          "absolute -top-4 left-1/2 z-30 -translate-x-1/2",
          style.rankImgSize,
        )}
      />
      {isOpen ? (
        <div
          className={cn(
            "absolute top-0 left-0 z-10 w-full aspect-145/351 bg-black/40",
            isSkeleton && "animate-pulse bg-white/10",
          )}
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 79%, 50% 100%, 0% 79%)",
          }}
        />
      ) : (
        <img
          src={leaderboardCeoImage(student.ceo?.title as CharacterName)}
          alt={student.name}
          className="w-full absolute top-0 left-0 object-cover object-top z-10 rounded-2xl"
        />
      )}
      <div className="relative z-20 w-full">
        <img
          src={style.frameImg}
          alt={`Rank ${rank}`}
          className="object-top w-full"
        />
        <div className="absolute inset-x-0 top-[70%] -translate-y-1/2 px-1.5 text-center">
          <p
            className={cn(
              "truncate w-full text-xs font-black uppercase text-white",
             
            )}
          >
            {isSkeleton ? (
              <span className="inline-block w-3/4 rounded bg-white/10 text-transparent animate-pulse">
                Placeholder
              </span>
            ) : isOpen ? (
              "Open Seat"
            ) : (
              student.name
            )}
          </p>
          <p className="truncate w-full text-[9px] text-white">
            {isSkeleton ? (
              <span className="inline-block w-1/2 rounded bg-white/10 text-transparent animate-pulse">
                Placeholder
              </span>
            ) : isOpen ? (
              "—"
            ) : (
              (student.ceo?.title ?? "—")
            )}
          </p>
          <p
            className={cn(
              "text-center text-lg min-[800px]:text-2xl font-bold",
              isOpen ? "text-white" : style.star,
            )}
          >
            {isSkeleton ? (
              <span className="inline-block w-10 rounded bg-white/10 text-transparent animate-pulse">
                ★ --
              </span>
            ) : isOpen ? (
              "★ --"
            ) : (
              `★ ${student.market_share}%`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function RankRow({
  student,
  rank,
  color = "#FF0000",
  loading,
}: {
  student?: LeaderboardStudent;
  rank: number;
  color?: string;
  loading?: boolean;
}) {
  const isOpen = !student;
  const isSkeleton = isOpen && loading;

  return (
    <div
      className="flex items-center gap-2 rounded-md border-1 bg-black/50 p-2"
      style={{
        borderColor: color,
        boxShadow: `-3px 2px 15px 0px ${color}A6 inset`,
      }}
    >
      <span className="flex-shrink-0 text-center min-[1600px]:text-3xl text-xl font-black text-white px-3">
        {ordinal(rank)}
      </span>
      {isOpen ? (
        <div className="flex items-center justify-center min-[1600px]:w-14 min-[1600px]:h-14 w-10 h-10 flex-shrink-0 p-2">
          {isSkeleton ? (
            <span className="w-full h-full rounded-full bg-white/10 animate-pulse" />
          ) : (
            <img
              src={images.personFill}
              alt="Open seat"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      ) : (
        <img
          src={rankIconCeoImage(student.ceo?.title as CharacterName)}
          alt={student.name}
          className="min-[1600px]:w-14 min-[1600px]:h-14 w-10 h-10 flex-shrink-0 object-cover"
          style={{ borderColor: color }}
        />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-xs font-black uppercase",
            isOpen ? "text-gray-400" : "text-white",
          )}
        >
          {isSkeleton ? (
            <span className="inline-block w-1/2 rounded bg-white/10 text-transparent animate-pulse">
              Placeholder
            </span>
          ) : isOpen ? (
            "Open Seat"
          ) : (
            student.name
          )}
        </p>
        <p className="truncate text-[9px] text-gray-400">
          {isSkeleton ? (
            <span className="inline-block w-1/3 rounded bg-white/10 text-transparent animate-pulse">
              Placeholder
            </span>
          ) : isOpen ? (
            "—"
          ) : (
            (student.ceo?.title ?? "—")
          )}
        </p>
      </div>
      <span
        className="flex-shrink-0 min-[1600px]:text-2xl text-xl font-black"
        style={{ color: isOpen ? "#6b7280" : color }}
      >
        {isSkeleton ? (
          <span className="inline-block w-10 rounded bg-white/10 text-transparent animate-pulse">
            ★ --
          </span>
        ) : isOpen ? (
          "★ --"
        ) : (
          `★ ${student.market_share}%`
        )}
      </span>
    </div>
  );
}

function Leaderboard({
  topStudents,
  color,
  loading,
}: {
  topStudents: LeaderboardStudent[];
  color?: string;
  loading?: boolean;
}) {
  if (!loading && topStudents.length === 0) return null;
  const rest = [topStudents[3], topStudents[4]];

  return (
    <div
      style={{
        backgroundImage: `url(${images.bgLeaderBoard})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className={`relative px-3 pt-3 flex flex-col gap-1 flex-1 justify-between items-center gap-1 bg-no-repeat overflow-hidden rounded-md border border-[${color}]`}
    >
      <img src={images.overlay} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="flex flex-col items-center w-full">
        <div className="w-1/3 flex justify-center items-center">
          <img src={images.crownBaron} alt="" className="w-full h-auto" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-4 w-4/5 max-w-80">
          <img src={images.leaderBoardBaron} alt="" className="w-full h-auto" />
        </div>

        <div className="flex gap-8 w-full justify-center mt-2">
          {[1, 0, 2].map((idx) => {
            const student = topStudents[idx];
            return (
              <PodiumCard
                key={student?.id ?? `open-seat-${idx + 1}`}
                student={student}
                rank={idx + 1}
                loading={loading}
              />
            );
          })}
        </div>
      </div>

      <div className=" flex flex-col gap-1.5 pb-2 w-full z-10">
        {rest.map((student, i) => (
          <RankRow
            key={student?.id ?? `open-seat-${i + 4}`}
            student={student}
            rank={i + 4}
            color={color}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

function PerkCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
  locked,
  unlockLevel,
  perkType,
  status,
  used,
  approved,
  assets,
}: {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  locked: boolean;
  unlockLevel?: number;
  perkType?: string;
  status?: string | null;
  used?: boolean;
  approved?: boolean;
  perkKey?: string;
  assets: CharacterAssets;
}) {
  const displayLevel =
    unlockLevel ?? requiredPerkLevel(perkType);

  let displayBadge = badge;
  let displayBadgeColor = badgeColor;

  if (!locked && !badge) {
    if (used) {
      displayBadge = "USED";
      displayBadgeColor = "#6b7280"; // gray
    } else if (status === "pending") {
      displayBadge = "PENDING";
      displayBadgeColor = "#f59e0b"; // amber
    } else if (status === "request") {
      displayBadge = "REQUESTED";
      displayBadgeColor = "#3b82f6"; // blue
    } else if (approved || status === "approved") {
      displayBadge = "APPROVED";
      displayBadgeColor = "#4ade80"; // green
    } else if (status === "denied") {
      displayBadge = "DENIED";
      displayBadgeColor = "#ef4444"; // red
    } else {
      displayBadge = "UNLOCKED";
      displayBadgeColor = "#a855f7"; // purple
    }
  }

  return (
    <div
      className={`relative flex items-center gap-3 rounded-md border bg-black/50 p-2 overflow-hidden ${assets.border} ${assets.shadow}`}
    >
      {/* Icon badge */}
      <div
        className={`flex min-[1600px]:h-14 min-[1600px]:w-14 w-10 h-10 flex-shrink-0 items-center justify-center rounded-lg border bg-black/60 text-2xl ${assets.border}`}
      >
        {locked ? (
          <Lock className={`h-5 w-5 ${assets.text}`} />
        ) : (
          <span className={assets.text}>{icon}</span>
        )}
      </div>

      {/* Title / level / description */}
      <div className="min-w-0 flex-1">
        <span className="block truncate min-[1600px]:text-sm text-xs font-black uppercase tracking-widest text-white">
          {title}
        </span>
        <span
          className={`block text-[8px] font-bold uppercase tracking-widest ${assets.text}`}
        >
          {locked
            ? `UNLOCK AT CEO LEVEL ${displayLevel}`
            : `LEVEL ${displayLevel}`}
        </span>
        {!locked && (
          <>
            {/* <div className={`my-1 border-t opacity-40 ${assets.border}`} /> */}
            <p className="truncate text-[10px] text-gray-400">{description}</p>
          </>
        )}
      </div>

      {/* Status pill */}
      {!locked && displayBadge && (
        <span
          className="flex flex-shrink-0 items-center gap-1.5 rounded-full border bg-black/60 px-3 py-1.5"
          style={{ borderColor: displayBadgeColor ?? assets.color }}
        >
          <CheckCircle2
            className="h-4 w-4"
            style={{ color: displayBadgeColor ?? assets.color }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: displayBadgeColor ?? assets.color }}
          >
            {displayBadge}
          </span>
        </span>
      )}
    </div>
  );
}

function PerkCardSkeleton({ assets }: { assets: CharacterAssets }) {
  return (
    <div
      className={`relative flex items-center gap-3 rounded-md border bg-black/50 p-2 overflow-hidden ${assets.border} ${assets.shadow}`}
    >
      {/* Icon badge */}
      <div
        className={`flex min-[1600px]:h-14 min-[1600px]:w-14 w-10 h-10 flex-shrink-0 items-center justify-center rounded-lg border bg-black/60 text-2xl ${assets.border}`}
      >
        <span className="inline-block h-5 w-5 rounded-full bg-white/10 animate-pulse" />
      </div>

      {/* Title / level / description */}
      <div className="min-w-0 flex-1">
        
        <span
          className={`block text-[10px] font-bold uppercase tracking-widest ${assets.text}`}
        >
          <span className="inline-block w-1/3 rounded bg-white/10 text-transparent animate-pulse">
            Placeholder
          </span>
        </span>
        <div className={`my-1 border-t opacity-40 ${assets.border}`} />
        <p className="truncate text-[10px] text-gray-400">
          <span className="inline-block w-3/4 rounded bg-white/10 text-transparent animate-pulse">
            Placeholder description text
          </span>
        </p>
      </div>

      {/* Status pill */}
      <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5">
        <span className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
        <span className="inline-block w-10 rounded bg-white/10 text-transparent animate-pulse text-[10px] font-bold uppercase tracking-wide">
          Placeholder
        </span>
      </span>
    </div>
  );
}

// ── LEFT PANEL ───────────────────────────────────────────────────────────────
export function LeftPanel({
  character,
  ceoLoading,
  assets,
  topStudents,
  leaderboardLoading,
}: {
  character: Character | null;
  ceoLoading: boolean;
  courseId: string | null;
  studentId: string;
  assets: CharacterAssets | null;
  topStudents: LeaderboardStudent[];
  leaderboardLoading?: boolean;
}) {
  const perks = character?.perks ?? [];
  const theme = assets ?? studentCeoAssets(null);

  return (
    <div
      className={`h-full flex flex-col justify-center item gap-2 overflow-y-auto w-full xl:w-1/3 `}
    >
      <Leaderboard
        topStudents={topStudents}
        color={theme.color}
        loading={leaderboardLoading}
      />
      {/* <ReadonlySkillView courseId={courseId} studentId={studentId} /> */}

      <div
        className={`flex flex-col gap-1 p-2 rounded-md overflow-hidden border ${theme.border} bg-black/40`}
      >
        <div className="px-4 flex items-center justify-between gap-2">
          <div
            className={`${theme.text} min-[1600px]:text-xl text-sm font-bold tracking-widest uppercase`}
          >
            My Perks
          </div>
          {!ceoLoading && perks.length > 0 && (
            <div
              className={`${theme.text} text-xs font-bold tracking-widest uppercase`}
            >
              {perks.filter((p) => isPerkAvailableAtLevel(p, character?.level)).length}/{perks.length} Active
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {ceoLoading || !character ? (
            <>
              <PerkCardSkeleton assets={theme} />
              <PerkCardSkeleton assets={theme} />
            </>
          ) : perks.length > 0 ? (
            perks.map((p) => (
              <PerkCard
                assets={theme}
                key={p.id}
                icon={isPerkAvailableAtLevel(p, character.level) ? "⚡" : "🔒"}
                title={p.title}
                description={p.description}
                locked={!isPerkAvailableAtLevel(p, character.level)}
                perkType={p.perk_type}
                status={p.status}
                used={p.used}
                approved={p.approved}
                perkKey={p.key}
              />
            ))
          ) : (
            <PerkCard
              assets={theme}
              icon="⚡"
              title="No perks yet"
              description="Complete missions to unlock perks."
              badge="LOCKED"
              badgeColor="#4a4a4a"
              locked={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
