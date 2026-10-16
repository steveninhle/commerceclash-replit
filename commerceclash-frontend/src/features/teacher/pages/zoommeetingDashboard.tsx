import { del, END_POINTS, get } from "@/api";
import { CreateMeetingDialog } from "@/features/teacher/components/CreateMeetingDialog";
import { ContinueClassDialog } from "@/features/teacher/components/ContinueClassDialog";
import MeetingRow from "@/features/teacher/components/MeetingRow";
import { ClassifiedMeetings, Meeting } from "@/components/types";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ManageClassPage } from "./manageClass";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import LoadingOverlay from "@/components/ui/loading-overplay";
import { useSearchParams } from "react-router-dom";

type ZoomMeeting = Meeting;

const EMPTY_CLASSIFIED: ClassifiedMeetings = {
  active: [],
  scheduled: [],
  completed: [],
};

interface SectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({
  title,
  count,
  defaultOpen = false,
  children,
}: SectionProps) {
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

        <span className="text-xs font-bold tracking-widest text-green-500 uppercase">
          {title}
        </span>

        {count > 0 && (
          <span className="text-xs font-bold text-green-500">({count})</span>
        )}
      </button>

      {open && <div className="space-y-2 pb-2">{children}</div>}
    </div>
  );
}

function filterMeetings(list: ZoomMeeting[], search: string): ZoomMeeting[] {
  if (!search) return list;
  return list.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase()),
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-xs text-gray-600 py-2 px-4">{label}</p>;
}

const CLASSES_QUERY_KEY = ["classes"] as const;

const hasMeetingPendingCreation = (classified: ClassifiedMeetings): boolean => {
  const now = Date.now();
  return [...classified.active, ...classified.scheduled].some((meeting) => {
    if (meeting.meeting_id || !meeting.start_time) return false;
    const start = new Date(meeting.start_time).getTime();
    return !Number.isNaN(start) && now - start < 60 * 60 * 1000;
  });
};

export function ZoomMeetingDashboard() {
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [deleteMeetingId, setDeleteMeetingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [managingClass, setManagingClass] = useState<{
    id: string;
    name: string;
    meetingId: string;
    passcode: string;
    startTime?: string | null;
    readOnly?: boolean;
  } | null>(null);
  const [continueMeeting, setContinueMeeting] = useState<Meeting | null>(null);

  const teacherName = user
    ? ((user as { name?: string }).name ?? "Teacher")
    : "Teacher";

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
      hasMeetingPendingCreation(query.state.data ?? EMPTY_CLASSIFIED)
        ? 20_000
        : false,
  });

  const fetchMeetings = () =>
    queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });

  // Restore managing class from URL
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
        });
      }
    }
  }, [classified, searchParams]);

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

  const handleDeleteMeeting = async (id: string) => {
    try {
      setDeleteMeetingId(id);
      await del(END_POINTS.DELETE_MEETING.replace("{cid}", id));
      toast.success("Meeting deleted successfully");
      queryClient.setQueryData(
        CLASSES_QUERY_KEY,
        (prev: ClassifiedMeetings = EMPTY_CLASSIFIED) => ({
          active: prev.active.filter((m) => m.id !== id),
          scheduled: prev.scheduled.filter((m) => m.id !== id),
          completed: prev.completed.filter((m) => m.id !== id),
        }),
      );
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleteMeetingId(null);
      setPendingDeleteId(null);
    }
  };

  const active = filterMeetings(classified.active, search);
  const scheduled = filterMeetings(classified.scheduled, search);
  const completed = filterMeetings(classified.completed, search);

  // Most recently ended class gets a "Continue" button
  const mostRecentCompletedId =
    classified.completed.length > 0
      ? classified.completed.reduce((latest, m) => {
          const mTime = new Date(m.end_time ?? m.created_at).getTime();
          const latestTime = new Date(
            latest.end_time ?? latest.created_at,
          ).getTime();
          return mTime > latestTime ? m : latest;
        }).id
      : null;

  const renderRows = (list: ZoomMeeting[], isCompleted = false) =>
    list.map((meeting) => (
      <MeetingRow
        teacher={teacherName}
        key={meeting.id}
        meeting={meeting}
        onJoin={() =>
          handleJoinMeeting(
            meeting.id,
            meeting.passcode,
            meeting.meeting_id,
            meeting.start_time,
          )
        }
        onContinue={() => setContinueMeeting(meeting)}
        onDelete={() => setPendingDeleteId(meeting.id)}
        deleting={deleteMeetingId === meeting.id}
        isCompleted={isCompleted}
        showContinue={isCompleted && meeting.id === mostRecentCompletedId}
        onManage={(id, name) => {
          setManagingClass({
            id,
            name,
            meetingId: meeting.meeting_id,
            passcode: meeting.passcode,
            startTime: meeting.start_time,
            readOnly: isCompleted,
          });

          const newParams = new URLSearchParams(searchParams);
          newParams.set("id", id);
          setSearchParams(newParams);
        }}
      />
    ));

  if (managingClass) {
    return (
      <ManageClassPage
        classId={managingClass.id}
        className={managingClass.name}
        meetingId={managingClass.meetingId}
        passcode={managingClass.passcode}
        startTime={managingClass.startTime}
        onBack={() => {
          setManagingClass(null);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete("id");
          setSearchParams(newParams);
        }}
        readOnly={false} // TODO: restore to managingClass.readOnly
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-6">
        <h1 className="text-3xl font-bold text-white">Classes</h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#111] border border-gray-800 pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 w-72"
            />
          </div>

          <Button
            variant="green"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setOpen(true)}
            className="px-4 py-2 text-sm !text-black !rounded-xs font-bold tracking-wide"
          >
            Create Class
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title="Active Classes" count={active.length} defaultOpen>
          {loading ? (
            <LoadingOverlay />
          ) : active.length === 0 ? (
            <EmptyRow label="No active classes." />
          ) : (
            renderRows(active)
          )}
        </Section>

        <Section title="Scheduled Classes" count={scheduled.length}>
          {scheduled.length === 0 ? (
            <EmptyRow label="No scheduled classes." />
          ) : (
            renderRows(scheduled)
          )}
        </Section>

        <Section title="Completed Classes" count={completed.length}>
          {completed.length === 0 ? (
            <EmptyRow label="No completed classes." />
          ) : (
            renderRows(completed, true)
          )}
        </Section>
      </div>

      <CreateMeetingDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={fetchMeetings}
      />

      <ConfirmDeleteModal
        open={!!pendingDeleteId}
        title="Delete Class"
        description="Are you sure you'd like to delete this class? All class data will be permanently removed. This cannot be undone."
        loading={!!deleteMeetingId}
        onConfirm={() =>
          pendingDeleteId && handleDeleteMeeting(pendingDeleteId)
        }
        onCancel={() => setPendingDeleteId(null)}
      />

      {continueMeeting && (
        <ContinueClassDialog
          meeting={continueMeeting}
          onClose={() => setContinueMeeting(null)}
          onSuccess={fetchMeetings}
        />
      )}
    </div>
  );
}
