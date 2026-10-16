import { ChevronDown, User, Users } from "lucide-react";
import {
  normalizeCharacterTitle,
  studentCeoAssets,
} from "@/utils/helper";
import type { CohortPlayer } from "./hooks/useCeoPicker";
import { ceoCardFor } from "./CeoCarousel";
import architectIcon from "@/assets/images/icon-choose-ceo/architect.png";
import baronIcon from "@/assets/images/icon-choose-ceo/baron.png";
import diplomatIcon from "@/assets/images/icon-choose-ceo/diplomat.png";
import explorerIcon from "@/assets/images/icon-choose-ceo/explorer.png";
import generalIcon from "@/assets/images/icon-choose-ceo/general.png";
import innovatorIcon from "@/assets/images/icon-choose-ceo/innovator.png";
import maverickIcon from "@/assets/images/icon-choose-ceo/maverick.png";
import oracleIcon from "@/assets/images/icon-choose-ceo/oracle.png";
import phoenixIcon from "@/assets/images/icon-choose-ceo/phoenix.png";
import shadowIcon from "@/assets/images/icon-choose-ceo/shadow.png";
import showmanIcon from "@/assets/images/icon-choose-ceo/showman.png";
import tycoonIcon from "@/assets/images/icon-choose-ceo/tycoon.png";

const CEO_ICONS: Record<string, string> = {
  architect: architectIcon,
  baron: baronIcon,
  diplomat: diplomatIcon,
  explorer: explorerIcon,
  general: generalIcon,
  innovator: innovatorIcon,
  maverick: maverickIcon,
  oracle: oracleIcon,
  phoenix: phoenixIcon,
  shadow: shadowIcon,
  showman: showmanIcon,
  tycoon: tycoonIcon,
  visionary: innovatorIcon,
};

interface CohortPlayersPanelProps {
  players: CohortPlayer[];
  capacity: number;
  currentStudentId: string;
  hasCohort: boolean;
  isLoading: boolean;
  hasError: boolean;
}

const PlayerRow = ({
  player,
  isCurrentStudent,
}: {
  player: CohortPlayer;
  isCurrentStudent: boolean;
}) => {
  const assets = studentCeoAssets(player.ceo_title);

  return (
    <div className={`flex h-20 min-w-0 shrink-0 items-center gap-3 overflow-hidden rounded-xl border bg-black/80 pr-3 xl:h-[clamp(54px,7.3vh,82px)] xl:gap-2 xl:pr-2 2xl:gap-3 2xl:pr-3 ${isCurrentStudent ? "border-[#FFCF62]/70" : "border-white/20"}`}>
      {player.ceo_title ? (
        <img
          src={ceoCardFor(player.ceo_title)}
          alt=""
          aria-hidden="true"
          className="h-full w-20 shrink-0 object-cover object-top xl:w-[clamp(54px,7.3vh,82px)]"
        />
      ) : (
        <div className="flex h-full w-20 shrink-0 items-center justify-center bg-black xl:w-[clamp(54px,7.3vh,82px)]">
          <User className="h-9 w-9 text-gray-500 xl:h-7 xl:w-7" aria-hidden="true" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
        <div className="truncate text-base font-bold leading-tight text-[#D4D4D4] xl:text-[clamp(11px,1.25vw,17px)] 2xl:text-lg">
          {player.name || "Student"}
          {isCurrentStudent && (
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#FFCF62] xl:ml-1 xl:text-[9px]">
              You
            </span>
          )}
        </div>
        <div
          className={`mt-0.5 truncate text-xs font-semibold xl:text-[clamp(9px,0.9vw,13px)] ${
            player.ceo_title ? assets.text : "text-gray-500"
          }`}
        >
          {player.ceo_title ?? "CEO not selected"}
        </div>
      </div>
      {player.ceo_title && (
        <img
          src={CEO_ICONS[normalizeCharacterTitle(player.ceo_title)] ?? baronIcon}
          alt=""
          aria-hidden="true"
          className="h-10 w-10 shrink-0 object-contain xl:h-[clamp(28px,3.6vh,42px)] xl:w-[clamp(28px,3.6vh,42px)]"
        />
      )}
    </div>
  );
};

const CohortPlayersPanel = ({
  players,
  capacity,
  currentStudentId,
  hasCohort,
  isLoading,
  hasError,
}: CohortPlayersPanelProps) => {
  const openSeats = capacity > 0 ? Math.max(capacity - players.length, 0) : 0;

  return (
    <div className="flex w-full max-w-sm flex-col rounded-2xl border border-[#B99033] bg-black/95 p-4 backdrop-blur-sm xl:h-full xl:min-h-0 xl:w-[24%] xl:max-w-none xl:shrink-0 xl:p-3 2xl:p-4">
      <div className="mb-3 flex items-center justify-between gap-2 xl:mb-2">
        <div className="font-gothic-condensed text-left text-2xl font-bold tracking-wide label-text-choose-ceo xl:text-[clamp(16px,1.8vw,28px)]">
          PLAYERS IN COHORT
        </div>
        <div className="font-gothic-condensed flex shrink-0 items-center gap-2 text-2xl font-bold tracking-wide label-text-choose-ceo xl:text-[clamp(17px,1.8vw,28px)]">
          <Users className="h-6 w-6 xl:h-5 xl:w-5" aria-hidden="true" />
          {players.length}
          {capacity > 0 ? `/${capacity}` : ""}
        </div>
      </div>

      <div className="flex max-h-[520px] min-h-0 flex-col gap-2 overflow-y-auto xl:max-h-[clamp(354px,calc(43.8vh+30px),522px)] xl:gap-1.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex h-20 shrink-0 animate-pulse items-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-black xl:h-[clamp(54px,7.3vh,82px)]"
            >
              <div className="h-full w-20 bg-white/10 xl:w-[clamp(54px,7.3vh,82px)]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
              </div>
            </div>
          ))
        ) : hasError ? (
          <p className="py-4 text-sm text-gray-400">
            Could not load the cohort players.
          </p>
        ) : !hasCohort ? (
          <p className="py-4 text-sm text-gray-400">
            Cohort roster is not available for this class.
          </p>
        ) : players.length ? (
          players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isCurrentStudent={player.id === currentStudentId}
            />
          ))
        ) : (
          <p className="py-4 text-sm text-gray-400">
            No students are listed in this cohort yet.
          </p>
        )}

        {!isLoading && !hasError && openSeats > 0 &&
          Array.from({ length: Math.min(openSeats, 8) }).map((_, index) => (
            <div
              key={`open-seat-${index}`}
              className="flex h-20 shrink-0 items-center gap-3 overflow-hidden rounded-xl border border-white/20 bg-[#080808] pr-3 xl:h-[clamp(54px,7.3vh,82px)] xl:gap-2 2xl:gap-3"
            >
              <div className="ml-1 flex h-[calc(100%_-_8px)] w-14 shrink-0 items-center justify-center rounded-lg bg-black xl:w-[clamp(44px,5.5vh,60px)]">
                <User className="h-9 w-9 fill-[#777] text-[#777] xl:h-7 xl:w-7" aria-hidden="true" />
              </div>
              <div className="text-base font-bold uppercase tracking-widest text-[#888] xl:text-[clamp(11px,1.1vw,16px)]">
                Open Seat
              </div>
            </div>
          ))}
      </div>

      <div className="mt-auto flex justify-center pt-3">
        <ChevronDown className="h-7 w-7 text-[#D5A437] drop-shadow-[0_0_5px_#C59127]" strokeWidth={3} aria-hidden="true" />
      </div>
    </div>
  );
};

export { CohortPlayersPanel };
