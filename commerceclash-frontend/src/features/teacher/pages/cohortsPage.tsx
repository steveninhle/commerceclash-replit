import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  Calendar,
  ArrowLeft,
  Video,
  Clock,
  Trash2,
  ChevronRight,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { get, del, END_POINTS } from "@/api";
import { Button } from "@/components/ui/button";
import { CreateCohortModal } from "../components/CreateCohortModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { ManageClassPage } from "./manageClass";
import LoadingOverlay from "@/components/ui/loading-overplay";
import { cn } from "@/lib/utils";

interface Cohort {
  id: string;
  name: string;
  program_name: string | null;
  level: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number;
  total_students: number;
  available_spots: number;
  status: string;
  tags: unknown;
}

interface CohortClass {
  id: string;
  name: string;
  meeting_id: string;
  meeting_link: string | null;
  passcode: string | null;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
  total_students: number;
}

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

const buildWeeks = (classList: CohortClass[]) => {
  const map = new Map<string, CohortClass[]>();
  for (const c of classList) {
    const key = c.start_time ? getWeekStart(new Date(c.start_time)) : "no-date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items], idx) => ({
      key,
      items: items.sort((a, b) =>
        (a.start_time ?? "").localeCompare(b.start_time ?? ""),
      ),
      weekNum: idx + 1,
    }));
};

function CohortDetail({
  cohort,
  onBack,
}: {
  cohort: Cohort;
  onBack: () => void;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Only the id is kept in state — the class object itself is derived from
  // the live query result below on every render, so it can never go stale
  // relative to `classes` (e.g. once the cron assigns meeting_link/meeting_id
  // while this view is already open).
  const [managingClassId, setManagingClassId] = useState<string | null>(null);

  // status/canJoin are derived from wall-clock time (start_time - 10min,
  // end_time, etc.), but nothing about that math changes when `classes`
  // itself changes — so once React Query stops refetching (no pending
  // meeting left to poll for), the component never re-renders again on its
  // own and status/canJoin stay frozen at whatever they were at the last
  // render, even though real time keeps moving past the join threshold.
  // This tick forces a re-render every 15s purely so "now" gets re-read,
  // independent of any query/network activity.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const queryClient = useQueryClient();
  const classesQueryKey = ["cohort-classes", cohort.id] as const;

  // A class is still "pending" a meeting while it has no meeting_link and
  // hasn't drifted too far past its own start_time — used to decide whether
  // the interval-polling fallback below should keep running.
  const hasPendingMeeting = (list: CohortClass[]) => {
    const now = Date.now();
    return list.some((c) => {
      if (c.meeting_link || !c.start_time) return false;
      const start = new Date(c.start_time).getTime();
      return !Number.isNaN(start) && now - start < 60 * 60 * 1000;
    });
  };

  // [Step 2] Fires on every render of CohortDetail. If a query.data update
  // (from step 1) lands but this line doesn't log again, the component isn't
  // re-rendering — that would point at a React.memo/parent gating issue, not
  // at React Query.

  const { data: classes = [], isLoading: loading } = useQuery({
    queryKey: classesQueryKey,
    queryFn: async () => {
      const res = await get(
        END_POINTS.COHORT_CLASSES.replace("{cohort_id}", cohort.id),
      );
      const data: CohortClass[] = res.data ?? [];
      // [Step 1] Confirms what actually landed in the React Query cache for
      // this fetch — compare this against the raw API response in Network
      // tab. If meeting_link is here but the UI doesn't update, the bug is
      // downstream of the cache, not in the fetch/cache itself.

      return data;
    },
    // The global QueryClient defaults (App.tsx) set staleTime: 30s and
    // refetchOnWindowFocus: false — fine for most data, but wrong here: this
    // endpoint is mutated by a server-side cron with no way to push a
    // notification to the client, so this view must always treat its data as
    // stale and re-check on every mount/focus/reconnect rather than trusting
    // a 30s-old cache.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Fallback for when nobody is around to focus/reconnect: poll while a
    // meeting assignment is still pending, stop once everything's resolved.
    // React Query pauses this automatically while the tab is hidden and
    // catches up via refetchOnWindowFocus instead — no manual visibility
    // handling needed.
    refetchInterval: (query) =>
      hasPendingMeeting(query.state.data ?? []) ? 20_000 : false,
  });

  const handleDelete = async (classId: string) => {
    setDeleting(true);
    try {
      await del(END_POINTS.DELETE_MEETING.replace("{cid}", classId));
      queryClient.setQueryData(classesQueryKey, (prev: CohortClass[] = []) =>
        prev.filter((c) => c.id !== classId),
      );
      toast.success("Class deleted");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete class");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const handleJoin = (c: CohortClass) => {
    localStorage.setItem(`meeting_${c.meeting_id}_courseId`, c.id);
    const url = `/meeting?meetingId=${c.meeting_id}&passcode=${c.passcode ?? ""}${c.start_time ? `&startTime=${encodeURIComponent(c.start_time)}` : ""}`;
    window.open(url, "_blank");
  };

  const getStatus = (c: CohortClass, now: number) => {
    const start = c.start_time ? new Date(c.start_time).getTime() : null;
    const end = c.end_time ? new Date(c.end_time).getTime() : null;
    if (end && now > end) return "completed";
    if (start && now > start + 2 * 60 * 60 * 1000) return "completed";
    if (start && now >= start - 10 * 60 * 1000) return "active";
    return "scheduled";
  };

  const weeks = buildWeeks(classes);
  const todayWeekKey = getWeekStart(new Date());
  const managingClass = classes.find((c) => c.id === managingClassId) ?? null;

  const renderClassRow = (c: CohortClass) => {
    const status = getStatus(c, nowTick);
    // Gate on meeting_link — the field the API and the DB actually use to
    // signal "a meeting exists" — instead of meeting_id, so this condition
    // can never drift from what GET /cohorts/{id}/classes reports.
    // Uses `nowTick` (not a fresh Date.now()) so it moves in lockstep with
    // the periodic re-render above instead of silently freezing between
    // ticks — see the nowTick effect for why that matters here.
    const canJoin =
      !!c.meeting_link &&
      status !== "completed" &&
      c.start_time != null &&
      nowTick >= new Date(c.start_time).getTime() - 10 * 60 * 1000;
    // [Step 3/4] `c` here is the element produced fresh by classes.map(...)
    // this render (via buildWeeks(classes)) — not a useState/useMemo copy.
    // If canJoin doesn't flip even though meeting_link below is non-empty,
    // the bug is in this condition, not in data plumbing.

    return (
      <div
        key={c.id}
        className="flex items-center gap-4 px-5 py-4 border border-gray-800 bg-[#121010] hover:border-green-700 hover:bg-[#0f1f0f] hover:shadow-[0_0_12px_rgba(34,197,94,0.1)] transition-all"
      >
        <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-[#1a1a1a]">
          <Video className="w-5 h-5 text-gray-500" />
        </div>

        <div className="flex-1 min-w-0 font-semibold">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-sm">{c.name}</span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {fmtDateTime(c.start_time)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {c.total_students} students
            </span>
            <span className="text-gray-700">•</span>
            <span
              className={cn(
                "font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-[9px]",
                {
                  "bg-green-900/50 text-green-400": status === "active",
                  "bg-blue-900/40 text-blue-400": status === "scheduled",
                  "bg-gray-800 text-gray-500":
                    status !== "active" && status !== "scheduled",
                },
              )}
            >
              {status}
            </span>
          </div>
        </div>

        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!c.meeting_link ? (
            <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider border border-gray-800 rounded px-2 py-1">
              No meeting
            </span>
          ) : status === "completed" ? (
            <Button
              variant="ghost"
              onClick={() => setManagingClassId(c.id)}
              className="text-xs font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
            >
              DETAILS
            </Button>
          ) : canJoin ? (
            <>
              <Button
                variant="green"
                onClick={() => handleJoin(c)}
                className="text-xs font-bold !rounded-xs !text-black tracking-wider"
              >
                JOIN CLASS
              </Button>
              <Button
                variant="ghost"
                onClick={() => setManagingClassId(c.id)}
                className="text-xs font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
              >
                MANAGE
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setManagingClassId(c.id)}
              className="text-xs font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
            >
              MANAGE
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setPendingDeleteId(c.id)}
            className="text-xs font-bold !rounded-xs !border-[0.9px] border-red-500 tracking-wider !text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  if (managingClass) {
    return (
      <ManageClassPage
        classId={managingClass.id}
        className={managingClass.name}
        meetingId={managingClass.meeting_id}
        passcode={managingClass.passcode ?? ""}
        startTime={managingClass.start_time}
        onBack={() => setManagingClassId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between pb-6">
        <div className="flex flex-col gap-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-xs uppercase tracking-widest font-bold mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cohorts
          </button>
          <h1 className="text-3xl mt-5 font-bold text-white">{cohort.name}</h1>

          {cohort.program_name && (
            <p className="text-sm text-gray-500">
              {cohort.program_name}
              {cohort.level ? ` · ${cohort.level}` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {cohort.total_students} / {cohort.max_students} students
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {fmt(cohort.start_date)} → {fmt(cohort.end_date)}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                {
                  "bg-green-900/50 text-green-400": cohort.status === "active",
                  "bg-gray-800 text-gray-500": cohort.status !== "active",
                },
              )}
            >
              {cohort.status}
            </span>
          </div>
          <span className="text-xs font-bold tracking-widest text-green-500 bg-green-500/10  mt-5 border-[0.5px] border-green-500 px-3 py-1 rounded-full">
            Week {weeks.filter((w) => w.key <= todayWeekKey).length}/
            {weeks.length} | {classes.length} Classes
          </span>
        </div>
      </div>

      {/* Week sections */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingOverlay />
        ) : weeks.length === 0 ? (
          <EmptyRow label="No classes yet." />
        ) : (
          (() => {
            const total = weeks.length;
            return weeks.map((week) => {
              const isCurrentWeek = week.key === todayWeekKey;
              const weekEnd = new Date(week.key);
              weekEnd.setDate(weekEnd.getDate() + 6);
              const label = `${fmtShort(week.key)} – ${fmtShort(weekEnd.toISOString())}`;
              return (
                <Section
                  key={week.key}
                  title={label}
                  count={week.items.length}
                  defaultOpen={isCurrentWeek}
                  weekNum={week.weekNum}
                  totalWeeks={total}
                >
                  {week.items.map(renderClassRow)}
                </Section>
              );
            });
          })()
        )}
      </div>

      <ConfirmDeleteModal
        open={!!pendingDeleteId}
        title="Delete Class"
        description="Are you sure you'd like to delete this class? All class data will be permanently removed."
        loading={deleting}
        onConfirm={() => pendingDeleteId && handleDelete(pendingDeleteId)}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

function Section({
  title,
  defaultOpen = false,
  weekNum,
  totalWeeks,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  weekNum?: number;
  totalWeeks?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-3 w-full text-left group"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-green-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-green-500" />
        )}
        <div className="flex items-center gap-2">
          {weekNum && totalWeeks && (
            <span className="text-xs font-bold tracking-widest text-green-500 uppercase">
              Week {weekNum}
            </span>
          )}
          <span className="text-xs font-semibold text-green-500">
            ({title})
          </span>
          {/* {count > 0 && (
            <span className="text-xs font-bold text-green-500">({count})</span>
          )} */}
        </div>
      </button>
      {open && <div className="space-y-2 pb-2">{children}</div>}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-xs text-gray-600 py-2 px-4">{label}</p>;
}

export function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Cohort | null>(null);

  const fetchCohorts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await get(END_POINTS.COHORTS);
      setCohorts(res.data ?? []);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to load cohorts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCohorts();
  }, [fetchCohorts]);

  if (selected) {
    return <CohortDetail cohort={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cohorts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your program cohorts
          </p>
        </div>
        <Button
          variant="green"
          onClick={() => setShowCreate(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Cohort
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-800 rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center flex-1 h-40">
            <LoadingOverlay />
          </div>
        ) : cohorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
            <GraduationCap className="w-8 h-8 opacity-40" />
            <p className="text-sm">No cohorts yet. Create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cohorts.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover:border-green-700 hover:bg-[#1e1e1e] transition-all text-left cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm leading-snug">
                      {c.name}
                    </p>
                    {c.program_name && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {c.program_name}
                        {c.level ? ` · ${c.level}` : ""}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                      c.status === "active"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-gray-800 text-gray-500",
                    )}
                  >
                    {c.status}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {c.description}
                  </p>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {c.total_students} / {c.max_students} students
                      {c.available_spots > 0 && (
                        <span className="text-green-500 ml-1">
                          ({c.available_spots} spots left)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {fmt(c.start_date)} → {fmt(c.end_date)}
                    </span>
                  </div>
                </div>

                {Array.isArray(c.tags) && (c.tags as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(c.tags as string[]).map((tag) => (
                      <span
                        key={tag}
                        className={cn("text-[10px] px-2 py-0.5 rounded-full", {
                          "bg-green-900/50 text-green-400": tag === "Featured",
                          "bg-gray-800 text-gray-400": tag !== "Featured",
                        })}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateCohortModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchCohorts}
      />
    </div>
  );
}
