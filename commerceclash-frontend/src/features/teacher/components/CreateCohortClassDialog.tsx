import { useEffect, useState } from 'react';
import { X, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, END_POINTS } from '@/api';
import { Button } from '@/components/ui/button';
import { StudentMultiSelect } from '@/features/student/components/StudentMultiSelect';
import { createMeetingPayload } from '@/transformers';

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  cohortId: string;
  onClose: () => void;
  onCreated: () => void;
}

const inputClass =
  'w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 ' +
  'px-4 py-2.5 rounded-md text-sm transition-all duration-200 ' +
  'focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 ' +
  'hover:border-gray-400';

const labelClass = 'text-[10px] font-bold tracking-widest uppercase text-white';

const DEFAULT_DURATION = 90;
const DEFAULT_POINTS = 4;

const pad = (n: number) => String(n).padStart(2, '0');
const getDefaultTitle = () => {
  const d = new Date();
  return `Class ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const getDefaultStartTime = () => {
  const d = new Date(Date.now() + 30 * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function CreateCohortClassDialog({ open, cohortId, onClose, onCreated }: Props) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [title, setTitle] = useState(getDefaultTitle());
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [allocatePoints, setAllocatePoints] = useState(DEFAULT_POINTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(getDefaultTitle());
    setStartTime(getDefaultStartTime());
    setAllocatePoints(DEFAULT_POINTS);
    setStudents(null);

    get(END_POINTS.COHORT_STUDENTS.replace('{cohort_id}', cohortId))
      .then((res) => {
        const list: Student[] = res.data ?? [];
        setStudents(list);
        setSelectedIds(list.map((s) => s.id));
      })
      .catch((err) => toast.error((err as Error).message ?? 'Failed to load students'));
  }, [open, cohortId]);

  if (!open) return null;

  const canSubmit = !submitting && !!title && !!startTime && selectedIds.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const startISO = new Date(startTime).toISOString();
      const endISO = new Date(new Date(startTime).getTime() + DEFAULT_DURATION * 60 * 1000).toISOString();

      // 1. Create Zoom meeting
      const meetingRes = await post(END_POINTS.CREATE_MEETING, { startTime: startISO });
      const { meeting_id, passcode, join_url } = meetingRes.data;

      if (!meeting_id || !passcode || !join_url) throw new Error('Failed to create Zoom meeting');

      // 2. Create class linked to cohort
      const payload = {
        ...createMeetingPayload({
          meetingId: meeting_id,
          name: title,
          meetingLink: join_url,
          passcode,
          duration: DEFAULT_DURATION,
          allocatePoints,
          enrolledStudents: selectedIds,
          startTime: startISO,
          endTime: endISO,
        }),
        cohortId,
      };

      await post(END_POINTS.CREATE_CLASS, payload);
      toast.success('Class created successfully');
      onCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const now = getDefaultStartTime().slice(0, 16);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70">
      <div className="relative w-[560px] max-h-[90vh] bg-[#222425] rounded-2xl px-5 py-8 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-bold text-white">Create Class</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-800 mb-6" />

        {students === null ? (
          <div className="flex justify-center items-center py-16">
            <LoaderCircle className="animate-spin w-6 h-6 text-green-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
            <p className={`${labelClass} border-b border-gray-800 pb-2`}>Class Details</p>

            <div className="space-y-1">
              <label className={labelClass}>Class Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter class name"
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelClass}>Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  min={now}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Allocate Points</label>
                <input
                  type="number"
                  value={allocatePoints}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(e) => setAllocatePoints(Number(e.target.value))}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <p className={`${labelClass} border-b border-gray-800 pb-2`}>
              Students ({students.length} in cohort)
            </p>

            {students.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No students enrolled in this cohort yet.</p>
            ) : (
              <StudentMultiSelect
                students={students.map((s) => ({
                  id: s.id,
                  name: s.name ?? s.email,
                  email: s.email,
                  is_active: true,
                  enrolled_courses: [],
                }))}
                selectedStudentIds={selectedIds}
                onSelectionChange={setSelectedIds}
                placeholder="Select students"
                searchPlaceholder="Search students..."
              />
            )}

            <Button
              type="submit"
              variant="green"
              disabled={!canSubmit}
              className="w-full mt-2 py-3 !rounded-xs !text-black text-xs font-bold tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin w-4 h-4" />
                  Creating...
                </>
              ) : (
                'Create Class'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
