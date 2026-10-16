import { END_POINTS, post } from "@/api";
import { Meeting } from "@/components/types";
import { Button } from "@/components/ui/button";
import { createMeetingPayload } from "@/transformers";
import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_DURATION = 90;
const DEFAULT_POINTS = 4;

const inputClass =
  "w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 " +
  "px-4 py-2.5 rounded-md text-sm transition-all duration-200 " +
  "focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 " +
  "hover:border-gray-400";

const labelClass = "text-[10px] font-bold tracking-widest uppercase text-white";

const getDefaultStartTime = () => {
  const d = new Date(Date.now() + 0.5 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface ContinueClassDialogProps {
  meeting: Meeting;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContinueClassDialog({ meeting, onClose, onSuccess }: ContinueClassDialogProps) {
  const [name, setName] = useState(meeting.name);
  const [startTime, setStartTime] = useState(getDefaultStartTime());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!startTime) return;
    setIsSubmitting(true);
    let zoomMeetingId: string | undefined;
    try {
      const startTimeISO = new Date(startTime).toISOString();

      const meetingResponse = await post(END_POINTS.CREATE_MEETING, { startTime: startTimeISO });
      const { join_url, meeting_id, passcode } = meetingResponse.data;

      if (!join_url || !meeting_id || !passcode) {
        throw new Error("Failed to create a valid meeting link.");
      }
      zoomMeetingId = meeting_id;

      const endTimeISO = new Date(
        new Date(startTime).getTime() + DEFAULT_DURATION * 60 * 1000,
      ).toISOString();

      const payload = createMeetingPayload({
        meetingId: meeting_id,
        name: name,
        meetingLink: join_url,
        passcode,
        duration: DEFAULT_DURATION,
        allocatePoints: meeting.allocated_points ?? DEFAULT_POINTS,
        startTime: startTimeISO,
        endTime: endTimeISO,
      });

      await post(END_POINTS.CONTINUE_CLASS.replace("{cid}", meeting.id), payload);

      toast.success(`"${meeting.name}" continued as a new class`);
      onSuccess();
      onClose();
    } catch (error) {
      if (zoomMeetingId) {
        toast.error(
          "Class setup failed. A Zoom meeting was created but could not be linked — please delete it from your Zoom account and try again.",
        );
      } else {
        toast.error("Failed to continue class. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = getDefaultStartTime().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-[460px] bg-[#222425] rounded-2xl px-6 py-8 shadow-2xl flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Continue Class</h2>
            <p className="text-xs text-gray-400 mt-1">
              A new class will be created copying all student progress (CEO, XP, MS, skills, perks).
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-800" />

        <div className="space-y-1">
          <label className={labelClass}>Class Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>New Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            min={now}
            onChange={(e) => setStartTime(e.target.value)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 !rounded-xs !border !border-gray-700 text-xs font-bold tracking-widest uppercase"
          >
            Cancel
          </Button>
          <Button
            variant="green"
            onClick={handleConfirm}
            disabled={isSubmitting || !startTime || !name.trim()}
            className="flex-1 !rounded-xs !text-black text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin w-4 h-4" />
                Creating...
              </>
            ) : (
              "Confirm & Create"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
