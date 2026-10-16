import { Student } from "@/components/types";
import { StudentRow } from "@/features/student/components/StudentRow";
import { NavigateFunction } from "react-router-dom";
import LoadingOverlay from "@/components/ui/loading-overplay";

interface Props {
  students: Student[];
  onToggleStatus: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  navigate: NavigateFunction;
  searchTerm?: string;
  onEdit?: (id: string) => void;
  loading?: boolean;
}

export const StudentTable = ({
  students,
  loading,
  onToggleStatus,
  onDelete,
  navigate,
  searchTerm,
  onEdit,
}: Props) => (
  <div className="flex-1 overflow-y-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#0f1f0f] shadow-[0_0_12px_rgba(34,197,94,0.1)]">
          {["Name", "Email", "Cohort", "Status", "Actions"].map((h) => (
            <th
              key={h}
              className="py-3 px-4 text-xs font-bold tracking-widest text-gray-600 uppercase text-center"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={5} className="py-12 text-center">
              <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                <LoadingOverlay />
              </div>
            </td>
          </tr>
        ) : students.length === 0 ? (
          <tr>
            <td colSpan={5} className="py-12 text-center text-sm text-gray-600">
              {searchTerm
                ? "No students match your search."
                : "No students found."}
            </td>
          </tr>
        ) : (
          students.map((student) => (
            <StudentRow
              key={student.id}
              student={student}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              navigate={navigate}
              onEdit={onEdit}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
);
