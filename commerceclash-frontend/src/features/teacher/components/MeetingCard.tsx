import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Calendar, Trash, Loader } from "lucide-react";
import { MeetingCardProps } from "@/components/types";

export const MeetingCard = ({
  meeting,
  onCopyUrl,
  onJoinMeeting,
  onDeleteMeeting,
  deleteMeetingId,
  id,
}: MeetingCardProps) => {
  return (
    <div className="p-4 border border-gray-400/50 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-medium">{meeting.name}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(meeting.created_at).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              Duration: {meeting.duration} minutes
            </p>
            <p className="text-sm text-muted-foreground">
              Passcode: {meeting.passcode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="border border-gray-400/50"
            variant="ghost"
            size="sm"
            onClick={() => onCopyUrl(meeting.meeting_link)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy URL
          </Button>
          <Button
            variant="ghost"
            className="border border-gray-400/50"
            size="sm"
            onClick={() => onJoinMeeting(meeting.meeting_link)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Join
          </Button>
          <Button
            variant="destructive"
            className="border border-gray-400/50"
            size="sm"
            onClick={() => onDeleteMeeting(meeting.id)}
            disabled={deleteMeetingId === id}
          >
            {deleteMeetingId === id ? (
              <>
                <Trash className="h-3 w-3 mr-1" />
                <Loader className="h-3 w-3 mr-1 animate-spin" />
              </>
            ) : (
              <>Delete</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
