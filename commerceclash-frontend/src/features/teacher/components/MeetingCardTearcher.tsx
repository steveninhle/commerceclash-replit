import { Button } from "@/components/ui/button";
import { MeetingItem } from "./MeetingItem";

interface ZoomMeeting {
  id: string;
  name: string;
  start_time?: string | null;
  meeting_id: string;
  passcode: string;
}

interface Props {
  teacher: string;
  cohort: ZoomMeeting;
  onJoin: (id: string, passcode: string, meetingId: string) => void;
  onManage: (
    id: string,
    name: string,
    meetingId: string,
    passcode: string,
  ) => void;
  // formatDate: (date: string) => string;
}

export const MeetingCardTeacher = ({
  cohort,
  onJoin,
  onManage,
  // formatDate,
  teacher,
}: Props) => {
  return (
    <MeetingItem
      name={cohort.name}
      startTime={cohort.start_time ?? ""}
      // formatDate={formatDate}
      teacher={teacher}
      renderActions={
        <>
          <Button
            variant="green"
            onClick={() =>
              onJoin(cohort.id, cohort.passcode, cohort.meeting_id)
            }
            className="text-xs font-bold !rounded-xs !text-black tracking-wider"
          >
            JOIN CLASS
          </Button>

          <Button
            variant="ghost"
            onClick={() =>
              onManage(
                cohort.id,
                cohort.name,
                cohort.meeting_id,
                cohort.passcode,
              )
            }
            className="text-xs font-bold !rounded-xs  border border-gray-200/20 tracking-wider"
          >
            MANAGE
          </Button>
        </>
      }
    />
  );
};
