/* eslint-disable @typescript-eslint/no-explicit-any */
import { del, END_POINTS } from "@/api";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useSocket, useUserContext } from "@/context";
import TableManageClass from "@/features/teacher/components/TableManageClass";
import {
  Archive,
  ChevronDown,
  LogIn,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { classReducer, initialClassState } from "../hooks/classReducer";
import { useClassSocket } from "../hooks/useClassSocket";
import { useClassStudents } from "../hooks/useClassStudents";
import { usePendingChanges } from "../hooks/usePendingChanges";
import { useStudentActions } from "../hooks/useStudentActions";
import { images } from "@/assets";

export interface StudentPerk {
  id: string;
  key: string;
  title: string;
  description: string | null;
  is_coded: boolean;
  is_repeatable: boolean;
  auto_approve: boolean;
  perk_status: string | null;
  is_unlocked: boolean;
  is_used: boolean;
  is_approved: boolean | null;
  last_used_at: string | null;
  next_available_at: string | null;
}

export interface SkillEntry {
  id: string;
  label: string;
  value: number;
}

export interface ClassStudent {
  id: string;
  // Nullable: students who registered via checkout haven't necessarily set a
  // display name yet.
  name: string | null;
  ceo?: { id: string; name: string };
  level?: number;
  xp?: number;
  ms?: number;
  skill_unlocked?: boolean;
  skillEntries?: SkillEntry[];
  perks?: StudentPerk[];
  available_points?: number;
}

// interface ClassMaterial {
//   id: string;
//   name: string;
//   updatedAt: string;
// }


interface ManageClassPageProps {
  classId: string;
  className: string;
  meetingId: string;
  passcode: string;
  startTime?: string | null;
  readOnly?: boolean;
  onBack: () => void;
}

// const MATERIALS: ClassMaterial[] = [
//   { id: "1", name: "Module_3_Strategy_Slides.pdf", updatedAt: "Updated 2h ago" },
//   { id: "2", name: "Business_Vocabulary_V2.docx", updatedAt: "Updated Yesterday" },
// ];

export function ManageClassPage({
  classId,
  className,
  meetingId,
  passcode,
  startTime,
  readOnly = false,
  onBack,
}: ManageClassPageProps) {
  const { id: teacherId } = useUserContext();
  const socket = useSocket();

  const [state, dispatch] = useReducer(classReducer, initialClassState);
  const [search, setSearch] = useState("");
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const [week] = useState("Week 3 of 8");

  const pendingPerkActionsRef = useRef<
    Map<string, { studentId: string; previousStatus: string | null }>
  >(new Map());

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const { fetchStudents, fetchRoles } = useClassStudents(classId, dispatch);

  useClassSocket({
    socket,
    classId,
    teacherId,
    dispatch,
    pendingPerkActionsRef,
    fetchStudents,
  });

  const {
    handleXpIncrease,
    handleXpChange,
    handleMsChange,
    handleSkillChange,
    handleToggleSkillLock,
    handleToggleAllSkillLock,
    handleCeoChange,
    handlePerkAction,
  } = useStudentActions({ classId, state, dispatch, socket, pendingPerkActionsRef });

  const { hasPendingChanges, handleSaveAll } = usePendingChanges(
    classId,
    state,
    dispatch,
    socket,
  );

  useEffect(() => {
    fetchStudents();
    fetchRoles();
  }, [fetchStudents, fetchRoles]);

  // ── Misc handlers ──────────────────────────────────────────────────────────

  const handleJoinClass = useCallback(() => {
    localStorage.setItem(`meeting_${meetingId}_courseId`, classId);
    const url = `/meeting?meetingId=${meetingId}&passcode=${passcode}${
      startTime ? `&startTime=${encodeURIComponent(startTime)}` : ""
    }`;
    window.open(url, "_blank");
  }, [meetingId, classId, passcode, startTime]);

  const handleDeleteClass = async () => {
    setDeletingClass(true);
    try {
      await del(END_POINTS.DELETE_MEETING.replace("{cid}", classId));
      toast.success("Class deleted");
      onBack();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeletingClass(false);
    setConfirmDeleteClass(false);
  };

  const filteredStudents = state?.students.filter((s) =>
    s?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-gray-800 mb-5">
          <div>
            <h1 className="text-3xl font-black tracking-widest text-green-400 uppercase">
              {className}
            </h1>
            <p className="text-xs text-gray-500 mt-1 space-x-2">
              <span>
                <span className="text-gray-400">Schedule:</span> Mon/Wed 10:00 AM
              </span>
              <span>
                <span className="text-gray-400">Teacher:</span> Zach
              </span>
              <span>
                <span className="text-gray-400">Students:</span> {state.students.length}
              </span>
              <span>
                <span className="text-gray-400">Progress:</span>{" "}
                <button className="inline-flex items-center gap-1 text-gray-300 hover:text-white">
                  {week} <ChevronDown className="w-3 h-3" />
                </button>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <button
                  onClick={() => setConfirmDeleteClass(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Class
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold tracking-widest uppercase transition-colors">
                  <Archive className="w-3.5 h-3.5" /> Archive Class
                </button>
                <button
                  onClick={handleJoinClass}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Join Class
                </button>
              </>
            )}
            {readOnly && (
              <span className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-500 border border-gray-700">
                Completed
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Student Roster */}
          <section className="border border-gray-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-black tracking-widest text-green-400 uppercase">
                Student Roster
              </h2>
              <div className="flex items-center gap-3">
                {!readOnly && hasPendingChanges && (
                  <button
                    onClick={handleSaveAll}
                    disabled={state.isSaving}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {state.isSaving ? "Saving..." : "Save All"}
                  </button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-[#111] border border-gray-800 pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-700 w-52"
                  />
                </div>
              </div>
            </div>
            <TableManageClass
              loading={state.loading}
              student={filteredStudents}
              originalStudents={state.originalStudents}
              roles={state.roles}
              readOnly={readOnly || state.isSaving}
              onXpIncrease={handleXpIncrease}
              onXpChange={handleXpChange}
              onMsChange={handleMsChange}
              onSkillChange={handleSkillChange}
              onCeoChange={handleCeoChange}
              onToggleSkillLock={handleToggleSkillLock}
              onToggleAllSkillLock={handleToggleAllSkillLock}
              perkLoadingIds={state.perkLoadingIds}
              onPerkAction={handlePerkAction}
            />
          </section>

          {/* Bottom panels */}
          <div className="grid grid-cols-2 gap-4 pb-4">
            {/* Class Materials */}
            <section className="border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black tracking-widest text-green-400 uppercase">
                  Class Materials
                </h2>
                {!readOnly && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold tracking-widest uppercase transition-colors">
                    <Upload className="w-3 h-3" /> Upload New
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <img
                    src={images.PaperIconEmpty}
                    alt="No materials"
                    className="w-14 h-14 opacity-40"
                  />
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">No data available</p>
                </div>
                {/* {MATERIALS.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 border-b border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-white font-semibold">{m.name}</p>
                        <p className="text-[10px] text-gray-600">{m.updatedAt}</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold tracking-widest text-red-500 hover:text-red-400 uppercase">
                      Delete
                    </button>
                  </div>
                ))} */}
              </div>
            </section>

            {/* Session Recordings */}
            <section className="border border-gray-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black tracking-widest text-green-400 uppercase">
                  Session Recordings
                </h2>
                {!readOnly && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold tracking-widest uppercase transition-colors">
                    <Upload className="w-3 h-3" /> Upload New
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <img
                    src={images.PaperIconEmpty}
                    alt="No materials"
                    className="w-14 h-14 opacity-40"
                  />
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">No data available</p>
                </div>
                {/* {RECORDINGS.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-900 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white font-semibold">{r.title}</p>
                        <p className="text-[10px] text-gray-600">{r.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-green-400 hover:text-green-300 uppercase">
                        <Play className="w-3 h-3" /> Play
                      </button>
                      <button className="text-[10px] font-bold tracking-widest text-red-500 hover:text-red-400 uppercase">
                        Delete
                      </button>
                    </div>
                  </div>
                ))} */}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDeleteClass}
        title="Delete Class"
        description={`Are you sure you'd like to delete "${className}"? All class data will be permanently removed. This cannot be undone.`}
        loading={deletingClass}
        onConfirm={handleDeleteClass}
        onCancel={() => setConfirmDeleteClass(false)}
      />
    </>
  );
}

