import { END_POINTS, get, post } from "@/api/index.ts";
import { StudentMultiSelect } from "@/features/student/components/StudentMultiSelect";
import {
  CreateMeetingDialogProps,
  CreateMeetingRequest,
  MeetingLink,
  Student,
} from "@/components/types";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/userContext/userContext";
import { createMeetingPayload } from "@/transformers";
import { LoaderCircle, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingOverlay from "@/components/ui/loading-overplay";

const inputClass =
  "w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 " +
  "px-4 py-2.5 rounded-md text-sm transition-all duration-200 " +
  "focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 " +
  "hover:border-gray-400";

const labelClass = "text-[10px] font-bold tracking-widest uppercase text-white";

const DEFAULT_DURATION = 90;
const DEFAULT_POINTS = 4;

const getDefaultTitle = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Class ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getDefaultStartTime = () => {
  const d = new Date(Date.now() + 0.5 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const CreateMeetingDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: CreateMeetingDialogProps) => {
  const { id: teacher_id } = useUserContext();

  const [formData, setFormData] = useState<CreateMeetingRequest>({
    title: getDefaultTitle(),
    startTime: getDefaultStartTime(),
    duration: DEFAULT_DURATION,
    allocatePoints: DEFAULT_POINTS,
    selectedStudentIds: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [students, setStudents] = useState<Student[] | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchStudents = async () => {
      try {
        const response = await get(
          END_POINTS.STUDENT.replace("{teacher_id}", teacher_id),
        );
        const list: Student[] = response.data;

        setStudents(list);
        setFormData({
          title: getDefaultTitle(),
          startTime: getDefaultStartTime(),
          duration: DEFAULT_DURATION,
          allocatePoints: DEFAULT_POINTS,
          selectedStudentIds: list.map((s) => s.id),
        });
      } catch (error) {
        toast.error((error as Error).message);
      }
    };

    fetchStudents();
  }, [teacher_id, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.startTime ||
      !formData.selectedStudentIds.length
    )
      return;

    setIsSubmitting(true);

    try {
      // 1. Generate Zoom meeting link first
      const startTimeISO = new Date(formData.startTime).toISOString();
      const meetingResponse = await post(END_POINTS.CREATE_MEETING, {
        startTime: startTimeISO,
      });

      const newMeetingLink: MeetingLink = {
        joinUrl: meetingResponse.data.join_url,
        startUrl: meetingResponse.data.start_url,
        meetingId: meetingResponse.data.meeting_id,
        passcode: meetingResponse.data.passcode,
      };

      if (
        !newMeetingLink.joinUrl ||
        !newMeetingLink.meetingId ||
        !newMeetingLink.passcode
      ) {
        throw new Error("Failed to create a valid meeting link.");
      }

      // 2. Create the class with the generated link
      const endTimeISO = new Date(
        new Date(formData.startTime).getTime() + DEFAULT_DURATION * 60 * 1000,
      ).toISOString();

      const payload = createMeetingPayload({
        meetingId: newMeetingLink.meetingId,
        name: formData.title,
        meetingLink: newMeetingLink.joinUrl,
        passcode: newMeetingLink.passcode,
        duration: DEFAULT_DURATION,
        allocatePoints: formData.allocatePoints,
        enrolledStudents: formData.selectedStudentIds,
        startTime: startTimeISO,
        endTime: endTimeISO,
      });

      await post(END_POINTS.CREATE_CLASS, payload);

      // toast.success("Meeting created successfully");

      onSubmit();
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCancel = () => {
    onOpenChange(false);
  };

  const now = getDefaultStartTime().slice(0, 16);

  const canSubmit =
    !isSubmitting &&
    !!formData.title &&
    !!formData.startTime &&
    formData.selectedStudentIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[560px] h-[620px] max-h-[90vh] bg-[#222425] rounded-2xl px-5 py-8 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-bold text-white">Create New Class</h2>

          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-800 mb-6" />

        {students === null ? (
          <div className="flex justify-center items-center flex-1">
            <LoadingOverlay />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 overflow-y-auto flex-1 pr-2.5"
          >
            <p className="text-xs font-bold tracking-widest uppercase text-white border-b border-gray-800 pb-2">
              Class Details
            </p>

            <div className="space-y-1">
              <label className={labelClass}>Class Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    title: e.target.value,
                  }))
                }
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
                  value={formData.startTime}
                  min={now}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      startTime: e.target.value,
                    }))
                  }
                  required
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Allocate Points</label>
                <input
                  type="number"
                  value={formData.allocatePoints}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      allocatePoints: Number(e.target.value),
                    }))
                  }
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <p className="text-xs font-bold tracking-widest uppercase text-white border-b border-gray-800 pb-2">
              Students
            </p>

            <StudentMultiSelect
              students={students}
              selectedStudentIds={formData.selectedStudentIds}
              onSelectionChange={(ids) =>
                setFormData((p) => ({
                  ...p,
                  selectedStudentIds: ids,
                }))
              }
              placeholder="Select Students"
              searchPlaceholder="Search students..."
            />

            <Button
              type="submit"
              variant="green"
              disabled={!canSubmit}
              className="w-full mt-2 py-3 !rounded-xs !text-black text-xs font-bold tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin w-4 h-4" />
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
