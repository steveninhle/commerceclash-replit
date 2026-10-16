import { END_POINTS, get } from "@/api";
import { MeetingCardTeacher } from "@/features/teacher/components/MeetingCardTearcher";
import { ClassifiedMeetings, Meeting } from "@/components/types";
import { Input } from "@/components/ui/input";
import { useUserContext } from "@/context/userContext/userContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { SettingsPage } from "@/pages/settings/settings";
import { ManageClassPage } from "./manageClass";
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Users,
  GraduationCap,
  // BookOpen,
} from "lucide-react";
import { commerceClashIcon } from "@/assets/images";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StudentDashboard } from "./studentDashboard";
import { ZoomMeetingDashboard } from "./zoommeetingDashboard";
import LoadingOverlay from "@/components/ui/loading-overplay";
import { CohortsPage } from "./cohortsPage";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutDashboard, key: "home" },
  // { label: "Classes", icon: BookOpen, key: "classes" },
  { label: "Students", icon: Users, key: "students" },
  { label: "Cohorts", icon: GraduationCap, key: "cohorts" },
];

type ZoomMeeting = Meeting;

const CLASSES_QUERY_KEY = ["classes"] as const;
const EMPTY_CLASSIFIED: ClassifiedMeetings = {
  active: [],
  scheduled: [],
  completed: [],
};

const hasMeetingAwaitingCreation = (
  classified: ClassifiedMeetings,
): boolean => {
  const now = Date.now();
  return [...classified.active, ...classified.scheduled].some((meeting) => {
    if (meeting.meeting_id || !meeting.start_time) return false;
    const start = new Date(meeting.start_time).getTime();
    return !Number.isNaN(start) && now - start < 60 * 60 * 1000;
  });
};

export const TeacherDashboard = () => {
  const { user, setIsLoggedIn } = useUserContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeNav = searchParams.get("tab") ?? "home";
  const [search, setSearch] = useState("");
  const [managingClass, setManagingClass] = useState<{
    id: string;
    name: string;
    meetingId: string;
    passcode: string;
    startTime?: string | null;
    readOnly?: boolean;
  } | null>(null);

  // Shares a cache entry with zoommeetingDashboard.tsx (same query key + same
  // /class endpoint) — both views stay in sync from one fetch instead of
  // maintaining independent copies of the same data.
  const { data: classified = EMPTY_CLASSIFIED, isLoading: loading } = useQuery({
    queryKey: CLASSES_QUERY_KEY,
    queryFn: async () => {
      const res = await get(END_POINTS.CLASS);
      return (res.data ?? EMPTY_CLASSIFIED) as ClassifiedMeetings;
    },
    // See cohortsPage.tsx for why the global 30s staleTime / no-focus-refetch
    // defaults are overridden here: this data is mutated by a server cron
    // with no client push, so it must always be treated as stale.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) =>
      hasMeetingAwaitingCreation(query.state.data ?? EMPTY_CLASSIFIED)
        ? 20_000
        : false,
  });

  // Restore managing class from URL on mount
  useEffect(() => {
    const classId = searchParams.get("id");
    if (
      classId &&
      (classified.active.length > 0 ||
        classified.scheduled.length > 0 ||
        classified.completed.length > 0)
    ) {
      const allMeetings = [
        ...classified.active,
        ...classified.scheduled,
        ...classified.completed,
      ];
      const meeting = allMeetings.find((m) => m.id === classId);
      if (meeting) {
        setManagingClass({
          id: meeting.id,
          name: meeting.name,
          meetingId: meeting.meeting_id,
          passcode: meeting.passcode,
          startTime: meeting.start_time,
          readOnly: !!meeting.end_time,
        });
      }
    }
  }, [classified, searchParams]);

  const teacherName = user
    ? ((user as { name?: string }).name ?? "Teacher")
    : "Teacher";

  // Show active + scheduled on the Home page as "Upcoming Classes"
  const upcomingMeetings: ZoomMeeting[] = useMemo(
    () => [...classified.active, ...classified.scheduled],
    [classified],
  );

  const handleJoinMeeting = (
    classId: string,
    passcode: string,
    meetingId: string,
    startTime?: string | null,
  ) => {
    localStorage.setItem(`meeting_${meetingId}_courseId`, classId);
    const url = `/meeting?meetingId=${meetingId}&passcode=${passcode}${startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0d0d0d] text-white">
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-gray-800">
        <div className="flex items-center gap-3 border-b border-gray-800 px-5 py-6">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded border border-green-700 bg-[#0a1a0a]">
            <img
              src={commerceClashIcon}
              alt="Commerce Clash"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[20px] leading-[32px] font-bold">
              Commerce Clash
            </p>
            <p className="text-[14px] font-semibold uppercase tracking-widest text-green-700">
              Command Center
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(({ label, icon: Icon, key }) => {
            const isActive = activeNav === key;

            return (
              <button
                key={key}
                onClick={() => {
                  const newParams = new URLSearchParams();
                  newParams.set("tab", key);
                  setSearchParams(newParams);
                  setManagingClass(null);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition-colors",
                  isActive &&
                    "border-l-2 border-green-500 bg-[#0a1a0a] text-green-400",
                  !isActive &&
                    "text-gray-500 hover:bg-[#111] hover:text-gray-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn("h-4 w-4", isActive && "text-green-400")}
                  />
                  {label}
                </div>

                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 px-3 py-4">
          <button
            onClick={() => {
              const newParams = new URLSearchParams();
              newParams.set("tab", "settings");
              setSearchParams(newParams);
              setManagingClass(null);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
              activeNav === "settings" &&
                "border-l-2 border-green-500 bg-[#0a1a0a] text-green-400",
              activeNav !== "settings" &&
                "text-gray-600 hover:bg-[#111] hover:text-gray-300",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>

          <button
            onClick={() => setIsLoggedIn(false)}
            className="flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-[#111] hover:text-gray-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {managingClass ? (
          <ManageClassPage
            classId={managingClass.id}
            className={managingClass.name}
            meetingId={managingClass.meetingId}
            passcode={managingClass.passcode}
            startTime={managingClass.startTime}
            readOnly={false} // TODO: restore to managingClass.readOnly
            onBack={() => {
              setManagingClass(null);
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("id");
              setSearchParams(newParams);
            }}
          />
        ) : activeNav === "classes" ? (
          <ZoomMeetingDashboard />
        ) : activeNav === "students" ? (
          <StudentDashboard />
        ) : activeNav === "cohorts" ? (
          <CohortsPage />
        ) : activeNav === "settings" ? (
          <SettingsPage />
        ) : (
          <>
            <header className="flex items-start justify-between pb-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">Welcome, {teacherName}!</h1>
                <p className="text-xl font-black text-[#94A1B7]">Home</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-56 rounded-md border border-gray-700 bg-[#1a1a1a] py-2 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:border-green-600 focus:outline-none"
                />
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto border border-gray-800 p-6 px-8 pb-8">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#94A1B7]">
                  Upcoming Classes
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                  {loading ? (
                    <LoadingOverlay />
                  ) : upcomingMeetings.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                      No upcoming classes
                    </div>
                  ) : (
                    upcomingMeetings.map((cohort: ZoomMeeting) => (
                      <MeetingCardTeacher
                        teacher={teacherName}
                        key={cohort.id}
                        cohort={cohort}
                        onJoin={(id, passcode, meetingId) =>
                          handleJoinMeeting(
                            id,
                            passcode,
                            meetingId,
                            cohort.start_time,
                          )
                        }
                        onManage={(id, name, meetingId, passcode) => {
                          setManagingClass({
                            id,
                            name,
                            meetingId,
                            passcode,
                            startTime: cohort.start_time,
                            readOnly: !!cohort.end_time,
                          });
                          setSearchParams({ tab: activeNav, id });
                        }}
                        // formatDate={formatDate}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
