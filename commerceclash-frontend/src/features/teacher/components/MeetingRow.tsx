import { Meeting } from "@/components/types";
import { MeetingItem } from "./MeetingItem";
import { Button } from "@/components/ui/button";
import { Eye, LogIn, PlayCircle, Settings2, Trash2 } from "lucide-react";

type ZoomMeeting = Meeting;

interface MeetingRowProps {
  teacher: string;
  meeting: ZoomMeeting;
  onJoin: () => void;
  onContinue: () => void;
  onDelete: () => void;
  deleting: boolean;
  onManage: (id: string, name: string) => void;
  showContinue?: boolean;
  isCompleted?: boolean;
}

function MeetingRow({
  meeting,
  onJoin,
  onContinue,
  onDelete,
  deleting,
  onManage,
  teacher,
  showContinue = false,
  isCompleted = false,
}: MeetingRowProps) {
  return (
    <MeetingItem
      teacher={teacher}
      name={meeting.name}
      startTime={meeting.start_time ?? meeting.created_at}
      renderActions={
        <>
          {isCompleted ? (
            <>
              {showContinue && (
                <Button
                  leftIcon={<PlayCircle className="w-3 h-3" />}
                  variant="green"
                  onClick={onContinue}
                  className="text-xs font-bold !rounded-xs !text-black tracking-wider"
                >
                  CONTINUE CLASS
                </Button>
              )}

              <Button
                leftIcon={<Eye className="w-3 h-3" />}
                variant="ghost"
                onClick={() => onManage(meeting.id, meeting.name)}
                className="text-xs font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
              >
                DETAILS
              </Button>
            </>
          ) : (
            <>
              <Button
                leftIcon={<LogIn className="w-3 h-3" />}
                variant="green"
                onClick={onJoin}
                className="text-xs font-bold !rounded-xs !text-black tracking-wider"
              >
                JOIN CLASS
              </Button>

              <Button
                leftIcon={<Settings2 className="w-3 h-3" />}
                variant="ghost"
                onClick={() => onManage(meeting.id, meeting.name)}
                className="text-xs font-bold !rounded-xs !border !border-gray-200/20 tracking-wider"
              >
                MANAGE
              </Button>
            </>
          )}

          <Button
            leftIcon={<Trash2 className="w-3 h-3" />}
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="text-xs font-bold !rounded-xs !border-[0.9px] border-red-500 tracking-wider !text-red-500 hover:bg-red-500/10"
          >
            DELETE
          </Button>
        </>
      }
    />
  );
}

export default MeetingRow;
