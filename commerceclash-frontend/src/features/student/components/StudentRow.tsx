import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Student } from "@/components/types";
import { NavigateFunction } from "react-router-dom";

interface Props {
  student: Student;
  onToggleStatus: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  navigate: NavigateFunction;
  onEdit?: (id: string) => void;
}

export const StudentRow = ({
  student,
  onToggleStatus,
  onDelete,
  navigate,
  onEdit,
}: Props) => (
  <tr className="border-b border-gray-800 bg-[#111] hover:border-green-700 hover:bg-[#0f1f0f] hover:shadow-[0_0_12px_rgba(34,197,94,0.05)] transition-all">
    {/* Name */}
    <td className="py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-black tracking-widest text-white uppercase">
          {student.name}
        </span>
        {student.is_new && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-900/60 text-green-400 border border-green-700/50">
            NEW
          </span>
        )}
      </div>
    </td>

    {/* Email */}
    <td className="py-4 px-4 text-center">
      <span className="text-xs text-gray-500 font-mono uppercase">
        {student.email}
      </span>
    </td>

    {/* Cohort */}
    <td className="py-4 px-4 text-center">
      <span className="text-xs text-gray-500 font-mono uppercase">
        {student.enrolled_courses?.length
          ? student.enrolled_courses.map((c) => c.name).join(", ")
          : "—"}
      </span>
    </td>

    {/* Status */}
    <td className="py-4 px-4 text-center">
      <Button
        variant="secondary"
        onClick={() => onToggleStatus(student.id, student.is_active)}
        className={cn(
          "w-[104px] flex items-center justify-center px-3 py-1 text-xs font-bold tracking-widest border transition-colors rounded-none",
          student.is_active
            ? "!border-green-700 !text-green-400 !bg-[#0a1a0a] !hover:bg-[#0f2a0f]"
            : "!border-yellow-700 !text-yellow-500 !bg-[#1a1500] !hover:bg-[#2a2000]",
        )}
      >
        {student.is_active ? "ACTIVE" : "ARCHIVED"}
      </Button>
    </td>

    {/* Actions */}
    <td className="py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={"green"}
          // leftIcon={<Pencil className="w-3 h-3" />}
          onClick={() =>
            onEdit
              ? onEdit(student.id)
              : navigate(`/student-details/${student.id}`)
          }
          className="text-xs !py-0 font-bold !rounded-xs !text-black tracking-wider"
        >
          EDIT
        </Button>
        <Button
          variant="ghost"
          // leftIcon={<Trash2 className="w-3 h-3" />}
          onClick={() => onDelete(student.id)}
          className="text-xs font-bold !rounded-xs  !border-[0.9px] border-red-500 tracking-wider !text-red-500 hover:bg-red-500/10"
        >
          DELETE
        </Button>
      </div>
    </td>
  </tr>
);
