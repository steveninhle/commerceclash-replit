import { del, get } from "@/api";
import { END_POINTS } from "@/api/endpoints";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { EnrolledCourse } from "@/components/types";
import { useSocket, useUserContext } from "@/context";
import { useLeaderboard } from "@/features/game/hooks/useLeaderboard";
import { urlBuilder } from "@/pages/home/helper";
import { transformCharacterResponse } from "@/transformers";
import { Character } from "@/transformers/types";
import { CharacterName, studentCeoAssets } from "@/utils/helper";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CenterPanel } from "./components/CenterPanel";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { ClassStatus } from "./types";
import { logoDashboardStudent } from "@/assets/images";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ── Main page ────────────────────────────────────────────────────────────────
const hasPendingMeeting = (course: EnrolledCourse | null): boolean => {
  if (!course || course.meeting_id || !course.start_time) return false;

  const start = new Date(course.start_time).getTime();
  return !Number.isNaN(start) && Date.now() - start < 60 * 60 * 1000;
};

export const StudentEnrolledCourses = () => {
  const socket = useSocket();
  const { id: student_id, setIsLoggedIn, setRole } = useUserContext();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const courseQueryKey = ["enrolled-course", student_id] as const;
  const { data: course = null } = useQuery({
    queryKey: courseQueryKey,
    queryFn: async () => {
      const res = await get(
        END_POINTS.STUDENT_ENROLLED_COURSES.replace("{student_id}", student_id),
      );
      return (res.data ?? null) as EnrolledCourse | null;
    },
    enabled: !!student_id,
    // See cohortsPage.tsx for why the global 30s staleTime / no-focus-refetch
    // defaults are overridden here: this data is mutated by a server cron
    // with no client push, so it must always be treated as stale.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) =>
      hasPendingMeeting(query.state.data ?? null) ? 20_000 : false,
  });
  const classId = course?.id ?? null;

  useEffect(() => {
    if (course?.id) {
      localStorage.setItem("currentCourseId", course.id);
      localStorage.setItem("activeCourseId", course.id);
      if (course.meeting_id) {
        localStorage.setItem(`meeting_${course.meeting_id}_courseId`, course.id);
      }
    }
  }, [course?.id, course?.meeting_id]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [ceoLoading, setCeoLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    topStudents,
    allStudents,
    isLoading: leaderboardLoading,
  } = useLeaderboard(course?.id ?? "");

  const myRankIndex = allStudents.findIndex((s) => s.id === student_id);
  const myRank = myRankIndex === -1 ? null : myRankIndex + 1;
  const myMarketShare =
    myRankIndex === -1 ? null : allStudents[myRankIndex].market_share;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole("");
    navigate("/auth/signin");
  };

  const nextClassIso = course?.start_time ?? null;

  const fetchCourse = () =>
    queryClient.invalidateQueries({ queryKey: courseQueryKey });

  // ── fetch assigned CEO (same pattern as CEO.tsx) ─────────────────────────
  const fetchAssignedCeo = useCallback(async (sid: string, cid: string) => {
    try {
      setCeoLoading(true);
      const res = await get(
        END_POINTS.GET_ASSIGNED_CEO.replace("{cid}", cid).replace("{sid}", sid),
      );
      setCharacter(transformCharacterResponse(res.data));
    } catch {
      /* no CEO assigned yet */
    } finally {
      setCeoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (student_id && classId) fetchAssignedCeo(student_id, classId);
  }, [student_id, classId, fetchAssignedCeo]);

  // ── socket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!classId || !student_id) return;
    const join = () =>
      socket.emit("join-room", { classId: [classId], studentId: student_id });
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
    };
  }, [classId, student_id, socket]);

  useEffect(() => {
    const onCeoAssigned = (res: {
      success: boolean;
      data: {
        result: {
          archetype: { id: string; title: string; sub_title: string };
          xp: number;
          level: number;
          perks: Parameters<typeof transformCharacterResponse>[0]["perks"];
        };
      };
    }) => {
      if (!res.success) return;
      const { archetype, xp, level, perks } = res.data.result;
      setCharacter(
        transformCharacterResponse({
          id: archetype.id,
          title: archetype.title,
          sub_title: archetype.sub_title,
          xp,
          level,
          perks,
        }),
      );
    };
    const onClassStatus = (msg: ClassStatus) => {
      queryClient.setQueryData(
        courseQueryKey,
        (prev: EnrolledCourse | null) => {
          if (!prev || prev.status === msg?.data?.status) return prev;
          return { ...prev, status: msg.data.status };
        },
      );
    };
    const onXpUpdated = (res: {
      success: boolean;
      data: { xp: number; level: number; studentId: string };
    }) => {
      if (!res.success || res.data.studentId !== student_id) return;
      setCharacter((prev) =>
        prev ? { ...prev, xp: res.data.xp, level: res.data.level } : prev,
      );
    };
    const onPerkUnlocked = (res: {
      success: boolean;
      data: { perkId: string; title: string };
    }) => {
      if (!res.success) return;
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              perks: prev.perks.map((p) =>
                p.id === res.data.perkId ? { ...p, is_unlocked: true } : p,
              ),
            }
          : prev,
      );
    };

    const onPerksAutoUnlocked = (res: {
      success: boolean;
      data: { studentId: string; perkIds: string[]; level: number; xp: number };
    }) => {
      if (!res.success || res.data.studentId !== student_id) return;
      const ids = new Set(res.data.perkIds);
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              level: res.data.level,
              xp: res.data.xp,
              perks: prev.perks.map((p) =>
                ids.has(p.id) ? { ...p, is_unlocked: true } : p,
              ),
            }
          : prev,
      );
    };

    const refreshPerks = () => {
      if (student_id && classId) void fetchAssignedCeo(student_id, classId);
    };
    const onPerkResult = (res: { success?: boolean; data?: { studentId?: string } }) => {
      if (res.success && (!res.data?.studentId || res.data.studentId === student_id)) refreshPerks();
    };
    const perkEvents = ["perk-activated", "perk-denied", "perk-status-changed", "perk-updated", "perk-cancel-confirmed"];
    perkEvents.forEach((event) => socket.on(event, onPerkResult));
    socket.on("connect", refreshPerks);

    socket.on("joined-room", () => {});
    socket.on("class-status", onClassStatus);
    socket.on("assigned-ceo", onCeoAssigned);
    socket.on("xp-updated", onXpUpdated);
    socket.on("perk-unlocked", onPerkUnlocked);
    socket.on("perks-auto-unlocked", onPerksAutoUnlocked);
    socket.on("class-list-updated", fetchCourse);
    return () => {
      perkEvents.forEach((event) => socket.off(event, onPerkResult));
      socket.off("connect", refreshPerks);
      socket.off("joined-room");
      socket.off("class-status", onClassStatus);
      socket.off("assigned-ceo", onCeoAssigned);
      socket.off("xp-updated", onXpUpdated);
      socket.off("perk-unlocked", onPerkUnlocked);
      socket.off("perks-auto-unlocked", onPerksAutoUnlocked);
      socket.off("class-list-updated", fetchCourse);
    };
  }, [socket, student_id, classId, fetchAssignedCeo, fetchCourse]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleJoin = (c: EnrolledCourse) => {
    setIsLoading(true);
    if (!c.status) {
      setIsLoading(false);
      return;
    }
    if (c.id) {
      localStorage.setItem("currentCourseId", c.id);
      localStorage.setItem("activeCourseId", c.id);
      if (c.meeting_id) {
        localStorage.setItem(`meeting_${c.meeting_id}_courseId`, c.id);
      }
    }
    navigate(
      urlBuilder("/meeting", { meetingId: c.meeting_id, passcode: c.passcode }),
      {
        state: { allocatePoints: c.allocate_points, courseId: c.id },
      },
    );
    setIsLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (courseToDelete) {
      try {
        await del(
          END_POINTS.UNENROLL_COURSE.replace(
            "{student_id}",
            student_id,
          ).replace("{class_id}", courseToDelete),
        );
        // toast.success("Unenrolled successfully");
        fetchCourse();
      } catch {
        // ignore unenroll error
      }
    }
    setCourseToDelete(null);
  };

  const assets = character
    ? studentCeoAssets(character.title as CharacterName)
    : null;

  const bgClass = assets?.bg ?? studentCeoAssets(null).bg;
  const ceoColor = assets?.color ?? studentCeoAssets(null).color;

  return (
    <div
      className={`h-screen w-full  flex flex-col ${bgClass} md:dashboard-outer dashboard-inner`}
    >
      <div className="w-full flex justify-between items-center px-4">
        <div className="flex gap-3 items-center">
          <div className="flex h-[60px] w-[60px] items-center justify-center">
            <img
              src={logoDashboardStudent}
              alt="Commerce Clash"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="font-gothic-condensed text-metal-gradient text-xl">
              COMMERCER CLASS
            </div>
            <div className={`text-xs font-black text-[${ceoColor}]`}>
              COMMAND CENTER
            </div>
          </div>
        </div>
        {/* <div className="flex gap-x-3">
          <button
            style={{ borderColor: ceoColor, backgroundColor: ceoColor }}
            className="flex items-center gap-2 rounded-md border-2 px-5 py-2 font-black uppercase tracking-widest text-white"
          >
            <House className="h-4 w-4" />
            Home
          </button>
          <button
            style={{ borderColor: ceoColor, color: ceoColor }}
            className="flex items-center gap-2 rounded-md border-2 bg-transparent px-5 py-2 font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Report
          </button>
        </div> */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex h-12 w-12 items-center justify-center rounded border border-purple-400 bg-[#0a1a0a] hover:border-purple-300 transition-colors"
          >
            <Settings className="h-7 w-7 text-purple-700" />
          </button>
          {settingsOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded border border-[#2a1a4a] bg-[#0d0a14] shadow-lg z-50 overflow-hidden">
               
              <div className="border-t border-[#2a1a4a]" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-[#1a1025] hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <ResponsiveLayout
        left={
          <LeftPanel
            assets={assets}
            character={character}
            ceoLoading={ceoLoading}
            courseId={classId}
            studentId={student_id}
            topStudents={topStudents}
            leaderboardLoading={leaderboardLoading}
          />
        }
        center={
          <CenterPanel
            isLoading={isLoading}
            ceoLoading={ceoLoading}
            course={course}
            character={character}
            assets={assets}
            nextClassIso={nextClassIso}
            myRank={myRank}
            myMarketShare={myMarketShare}
            studentName={user?.name}
            onJoin={handleJoin}
            onDelete={(id) => {
              setCourseToDelete(id);
              setDeleteDialogOpen(true);
            }}
          />
        }
        right={
          <RightPanel
            assets={assets}
            courseId={classId}
            studentId={student_id}
            activeCeoTitle={character?.title ?? null}
          />
        }
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Leave Class"
        description={`Are you sure you want to leave "${course?.name ?? ""}"?`}
        confirmButtonText="Leave"
        cancelButtonText="Cancel"
      />
    </div>
  );
};
