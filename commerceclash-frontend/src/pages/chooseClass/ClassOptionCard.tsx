import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  GraduationCap,
  ListChecks,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PillButton } from "@/components/ui/pill-button";
import {
  formatDayOfWeek,
  formatShortDate,
  formatTime12h,
  formatTimezoneOffset,
  getMinutesBetween,
} from "@/pages/chooseClass/format";
import type { Cohort } from "@/pages/chooseClass/types";
import { zachImage } from "@/assets/images";
import { CardStripe } from "@/components/ui/cart-stripe";

type ClassOptionCardProps = {
  cohort: Cohort;
};

// Derives the "Every Saturday  10:00 am (GMT +4)" header from the cohort's
// real weekly schedule + timezone. A cohort can have more than one weekly
// slot (e.g. Tue + Thu) — those are joined into one day label, assuming a
// shared time across entries, which holds for every schedule type today.
const getScheduleLabels = (
  cohort: Cohort,
): { day: string; time: string | null } => {
  if (cohort.schedules.length === 0) {
    return { day: "Schedule to be announced", time: null };
  }
  const dayNames = Array.from(
    new Set(
      cohort.schedules.map((schedule) => formatDayOfWeek(schedule.day_of_week)),
    ),
  );
  const timezoneOffset = formatTimezoneOffset(cohort.timezone);
  const time = formatTime12h(cohort.schedules[0].start_time);
  return {
    day: `Every ${dayNames.join(" & ")}`,
    time: timezoneOffset ? `${time} (${timezoneOffset})` : time,
  };
};

// Derives "8 sessions" / "75 min / each" from the cohort's real data —
// total_classes is the actual count of generated classes for this cohort
// (cohorts.total_sessions is an unused curriculum-length default, always 8,
// not per-cohort data); duration comes from the first weekly schedule
// slot's start/end time (all slots share a duration today).
const getSessionLabels = (
  cohort: Cohort,
): { count: string; duration: string | null } => {
  const count = `${cohort.total_classes} session${cohort.total_classes === 1 ? "" : "s"}`;
  const firstSchedule = cohort.schedules[0];
  if (!firstSchedule) return { count, duration: null };
  const minutes = getMinutesBetween(
    firstSchedule.start_time,
    firstSchedule.end_time,
  );
  return { count, duration: minutes > 0 ? `${minutes} min / each` : null };
};

const TEACHER_NAME = "Zach";
const TEACHER_REVIEW_LABEL = "Read 60+ reviews";
const TEACHER_TITLE = "Business Coach";
const TEACHER_EXPERIENCE = "11+ years experience";

type FactIconProps = {
  icon: typeof Calendar;
  tone?: "default" | "danger";
};

const FactIcon = ({ icon: Icon, tone = "default" }: FactIconProps) => (
  <span
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
      tone === "danger" ? "bg-red-50" : "bg-[#F3F5F4]",
    )}
  >
    <Icon
      className={cn(
        "h-5 w-5",
        tone === "danger" ? "text-red-500" : "text-green-600",
      )}
      aria-hidden="true"
    />
  </span>
);

type DetailItemProps = {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone?: "default" | "danger";
};

const DetailItem = ({
  icon,
  label,
  value,
  tone = "default",
}: DetailItemProps) => (
  <div className="flex items-start gap-2.5">
    <FactIcon icon={icon} tone={tone} />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold",
          tone === "danger" ? "text-red-500" : "text-gray-900",
        )}
      >
        {value}
      </p>
    </div>
  </div>
);

const TeacherDetailItem = () => (
  <div className="flex items-start gap-2.5">
    <img
      src={zachImage}
      alt={TEACHER_NAME}
      className="h-10 w-10 shrink-0 rounded-full object-cover"
    />
    <div>
      <p className="text-sm text-gray-500">Teacher</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
        <span className="text-base font-bold text-gray-900">
          {TEACHER_NAME}
        </span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
          ))}
        </span>
        <span className="text-sm text-gray-500 underline">
          {TEACHER_REVIEW_LABEL}
        </span>
      </div>
    </div>
  </div>
);

const ClassOptionCard = ({ cohort }: ClassOptionCardProps) => {
  const navigate = useNavigate();
  const isFull = cohort.available_spots <= 0;
  const schedule = getScheduleLabels(cohort);
  const sessionLabels = getSessionLabels(cohort);

  return (
    <CardStripe bordered padded={false} className="min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 border-b border-[#E5E5E5] bg-[#F5F5F5] px-5 py-5 text-center">
        <span className="text-2xl font-bold text-gray-900">{schedule.day}</span>
        {schedule.time && (
          <span className="text-2xl text-gray-700">{schedule.time}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 px-5 pt-5">
        {cohort.description && (
          <p className="text-sm text-gray-600">{cohort.description}</p>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailItem
            icon={Calendar}
            label="Dates"
            value={`Starts ${formatShortDate(cohort.start_date) ?? "TBD"} — Ends ${formatShortDate(cohort.end_date) ?? "TBD"}`}
          />
          <DetailItem
            icon={Users}
            label="Small Group"
            value={`${cohort.max_students} students max`}
          />

          <DetailItem
            icon={Clock}
            label={sessionLabels.count}
            value={sessionLabels.duration ?? "Duration TBD"}
          />
          <DetailItem
            icon={ListChecks}
            label={isFull ? "Sold Out" : "Limited Seats Available"}
            value={
              isFull
                ? "This course is sold out"
                : `${cohort.available_spots} spot${cohort.available_spots === 1 ? "" : "s"} remaining`
            }
            tone={isFull ? "danger" : "default"}
          />

          <TeacherDetailItem />
          <DetailItem
            icon={GraduationCap}
            label={TEACHER_TITLE}
            value={TEACHER_EXPERIENCE}
          />
        </div>
      </div>

      <div className="px-5 pt-5 pb-5">
        {/* {isFull && (
          <p className="mb-2.5 text-sm text-red-500">
            Product is not available in this quantity.
          </p>
        )} */}
        <PillButton
          disabled={isFull}
          aria-disabled={isFull}
          onClick={() => navigate("/checkout", { state: { cohort } })}
        >
          {isFull ? "Sold Out" : "Continue"}
        </PillButton>
      </div>
    </CardStripe>
  );
};

export { ClassOptionCard };
