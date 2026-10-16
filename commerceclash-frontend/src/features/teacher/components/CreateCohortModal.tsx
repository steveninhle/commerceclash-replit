import { useEffect, useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { post, END_POINTS } from "@/api";
import { cn } from "@/lib/utils";

interface CreateCohortForm {
  name: string;
  program_name: string;
  level: string;
  description: string;
  start_date: string;
  end_date: string;
  max_students: string;
  is_public: boolean;
  tags: string;
}

interface ScheduleEntry {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const FIELD_CLASS =
  "w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 " +
  "px-4 py-2.5 rounded-md text-sm transition-all duration-200 " +
  "focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 " +
  "hover:border-gray-400";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

let scheduleIdCounter = 0;

const generateIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function CreateCohortModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateCohortForm>({
    name: "",
    program_name: "",
    level: "",
    description: "",
    start_date: "",
    end_date: "",
    max_students: "",
    is_public: false,
    tags: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCohortForm, string>>
  >({});
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [scheduleErrors, setScheduleErrors] = useState<
    Record<number, Record<string, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
 
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  useEffect(() => {
    if (open) setIdempotencyKey(generateIdempotencyKey());
  }, [open]);

  if (!open) return null;

  const set = (field: keyof CreateCohortForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addSchedule = (day_of_week: number) => {
    setSchedules((prev) => [
      ...prev,
      { id: ++scheduleIdCounter, day_of_week, start_time: "09:00", end_time: "11:00" },
    ]);
  };

  const toggleDay = (day: number) => {
    // Always add a new schedule for the selected day
    addSchedule(day);
  };

  const removeSchedule = (id: number) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setScheduleErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateSchedule = (
    id: number,
    field: keyof Omit<ScheduleEntry, "id">,
    value: string | number,
  ) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
    setScheduleErrors((prev: any) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: undefined },
    }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.max_students && isNaN(Number(form.max_students)))
      e.max_students = "Must be a number";
    if (form.max_students && Number(form.max_students) < 1)
      e.max_students = "Must be at least 1";
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = "End date must be after start date";
    if (schedules.length > 0 && !form.start_date)
      e.start_date = "Required when schedules are added";
    if (schedules.length > 0 && !form.end_date)
      e.end_date = "Required when schedules are added";
    return e;
  };

  const validateSchedules = () => {
    const errs: typeof scheduleErrors = {};
    for (const s of schedules) {
      const e: Record<string, string> = {};
      if (!s.start_time) e.start_time = "Required";
      if (!s.end_time) e.end_time = "Required";
      if (s.start_time && s.end_time && s.end_time <= s.start_time)
        e.end_time = "Must be after start";
      if (Object.keys(e).length) errs[s.id] = e;
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    const schErrs = validateSchedules();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (Object.keys(schErrs).length) { setScheduleErrors(schErrs); return; }

    setSubmitting(true);
    try {
      const cohort = await post(
        END_POINTS.CREATE_COHORT,
        {
          name: form.name.trim(),
          program_name: form.program_name.trim() || undefined,
          level: form.level.trim() || undefined,
          description: form.description.trim() || undefined,
          start_date: form.start_date || undefined,
          end_date: form.end_date || undefined,
          // Captured so recurring schedule times ("09:00" etc.) are interpreted in
          // the teacher's own timezone when converted to UTC on the backend.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          max_students: form.max_students ? Number(form.max_students) : undefined,
          is_public: form.is_public,
          tags: form.tags
            ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : undefined,
        },
        // The backend creates a real, unique Zoom meeting before saving the
        // cohort. If this request is retried (network hiccup, or the teacher
        // clicking "Create Cohort" again after a transient failure), this
        // key lets the backend return the original cohort instead of
        // creating a second Zoom meeting.
        { headers: { "Idempotency-Key": idempotencyKey } },
      );

      const cohortId: string = cohort?.id ?? cohort?.data?.id;

      if (cohortId && schedules.length > 0) {
        const schedulesUrl = END_POINTS.COHORT_SCHEDULES.replace("{cohort_id}", cohortId);
        await Promise.all(
          schedules.map((s) =>
            post(schedulesUrl, {
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
            }),
          ),
        );

        if (form.start_date && form.end_date) {
          const generateUrl = END_POINTS.COHORT_SCHEDULES_GENERATE.replace("{cohort_id}", cohortId);
          const result = await post(generateUrl, {});
          const created: number = result?.data?.created ?? 0;
          toast.success(`Cohort created — ${created} class(es) generated from schedule`);
        } else {
          toast.success("Cohort created with schedules");
        }
      } else {
        toast.success("Cohort created successfully");
      }

      onCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create cohort");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-lg bg-[#141414] rounded-2xl shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Create Cohort</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <FormField label="Cohort Name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Spring 2026 Cohort"
                className={FIELD_CLASS}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Date" error={errors.start_date}>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  className={`${FIELD_CLASS} [color-scheme:dark]`}
                />
              </FormField>
              <FormField label="End Date" error={errors.end_date}>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  className={`${FIELD_CLASS} [color-scheme:dark]`}
                />
              </FormField>
            </div>

            <FormField label="Max Students" error={errors.max_students}>
              <Input
                type="number"
                min={1}
                value={form.max_students}
                onChange={(e) => set("max_students", e.target.value)}
                placeholder="e.g. 30"
                className={FIELD_CLASS}
              />
            </FormField>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set("is_public", !form.is_public)}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                  form.is_public ? "bg-green-600" : "bg-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    form.is_public ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-300">Make cohort public</span>
            </label>

            {/* Recurring Schedules */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">Recurring Schedule</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pick days of the week — classes will be auto-generated from these slots
                </p>
              </div>

              <div className="flex gap-x-2">
                {DAY_FULL.map((full, i) => {
                  const count = schedules.filter((s) => s.day_of_week === i).length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs font-bold transition-all relative",
                        count > 0
                          ? "bg-green-900/40 border-green-600 text-green-400"
                          : "bg-[#111] border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300",
                      )}
                    >
                      <span>{DAY_LABELS[i]}</span>
                      <span className="text-[9px] font-normal opacity-60">{full.slice(0, 3)}</span>
                      {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {schedules.length > 0 && (
                <div className="space-y-2">
                  {schedules
                    .slice()
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5"
                      >
                        <span className="text-xs font-semibold text-green-400 w-[88px] shrink-0">
                          {DAY_FULL[s.day_of_week]}
                        </span>

                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1">
                            <input
                              type="time"
                              value={s.start_time}
                              step={300}
                              onChange={(e) => updateSchedule(s.id, "start_time", e.target.value)}
                              className={`${FIELD_CLASS} [color-scheme:dark] ${scheduleErrors[s.id]?.start_time ? "!border-red-500" : ""}`}
                            />
                            {scheduleErrors[s.id]?.start_time && (
                              <p className="text-xs text-red-400 mt-0.5">{scheduleErrors[s.id].start_time}</p>
                            )}
                          </div>

                          <span className="text-gray-600 text-xs shrink-0">to</span>

                          <div className="flex-1">
                            <input
                              type="time"
                              value={s.end_time}
                              step={300}
                              onChange={(e) => updateSchedule(s.id, "end_time", e.target.value)}
                              className={`${FIELD_CLASS} [color-scheme:dark] ${scheduleErrors[s.id]?.end_time ? "!border-red-500" : ""}`}
                            />
                            {scheduleErrors[s.id]?.end_time && (
                              <p className="text-xs text-red-400 mt-0.5">{scheduleErrors[s.id].end_time}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSchedule(s.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="green"
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white border-0"
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {submitting ? "Creating…" : "Create Cohort"}
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
}
