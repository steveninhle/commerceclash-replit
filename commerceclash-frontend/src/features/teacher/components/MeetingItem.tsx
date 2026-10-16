import { formatDate } from "@/utils/validations";
import { Calendar, GraduationCap, User, Users } from "lucide-react";

interface MeetingItemProps {
  name: string;
  startTime: string;
  // formatDate: (date: string) => string;
  teacher: string;
  renderActions?: React.ReactNode;
  onClick?: () => void;
}

export const MeetingItem = ({
  name,
  // createdAt,
  startTime,
  // formatDate,
  renderActions,
  teacher,
  onClick,
}: MeetingItemProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 border border-gray-800 bg-[#121010] hover:border-green-700 hover:bg-[#0f1f0f] hover:shadow-[0_0_12px_rgba(34,197,94,0.1)] transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-[#1a1a1a]">
        <GraduationCap className="w-5 h-5 text-gray-500" />
      </div>

      <div className="flex-1 min-w-0 font-semibold">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm">{name}</span>

          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {formatDate(startTime)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            STUDENTS
          </span>

          <span className="text-gray-700">•</span>

          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            TEACHER: {teacher}
          </span>

          <span className="text-gray-700">•</span>

        </div>
      </div>

      {renderActions && (
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {renderActions}
        </div>
      )}
    </div>
  );
};
