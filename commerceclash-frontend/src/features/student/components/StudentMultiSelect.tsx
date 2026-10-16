import { useState } from "react";
import { StudentBadge } from "@/features/student/components/StudentBadge";
import { StudentMultiSelectProps } from "@/components/types";
import { Search } from "lucide-react";

export const StudentMultiSelect = ({
  students,
  selectedStudentIds,
  onSelectionChange,
  placeholder = "Select Students",
  searchPlaceholder = "Search students...",
  maxHeight = "max-h-48",
}: StudentMultiSelectProps) => {
  const [search, setSearch] = useState("");

  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedStudents = students.filter((s) =>
    selectedStudentIds.includes(s.id),
  );

  const handleToggle = (id: string) => {
    onSelectionChange(
      selectedStudentIds.includes(id)
        ? selectedStudentIds.filter((sid) => sid !== id)
        : [...selectedStudentIds, id],
    );
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-[10px] font-bold tracking-widest uppercase text-white !mb-1">
        {placeholder}
        {selectedStudents.length > 0 && (
          <span className="ml-2 text-green-400 normal-case tracking-normal font-normal">
            ({selectedStudents.length} selected)
          </span>
        )}
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#2c2f31] border border-[#3a3d40] text-white placeholder:text-gray-500 pl-9 pr-4 py-2.5 rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-gray-400"
        />
      </div>

      {/* Student list */}
      <div
        className={`bg-[#2c2f31] border border-[#3a3d40] rounded-md p-2 ${maxHeight} overflow-y-auto`}
      >
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-3">
            No students found
          </p>
        ) : (
          filteredStudents.map((student) => {
            const checked = selectedStudentIds.includes(student.id);
            return (
              <label
                key={student.id}
                className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-[#363a3c] transition-colors group"
              >
                {/* Custom checkbox */}
                <span
                  className={`w-4 h-4 flex-shrink-0 rounded border transition-all ${
                    checked
                      ? "bg-green-500 border-green-500"
                      : "bg-transparent border-[#3a3d40] group-hover:border-gray-400"
                  } flex items-center justify-center`}
                >
                  {checked && (
                    <svg
                      className="w-2.5 h-2.5 text-black"
                      viewBox="0 0 10 8"
                      fill="none"
                    >
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(student.id)}
                  className="sr-only"
                />
                <span className="text-sm text-white">{student.name}</span>
              </label>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1 min-h-[28px]">
        {selectedStudents.map((student) => (
          <StudentBadge
            key={student.id}
            student={student}
            onRemove={(id) =>
              onSelectionChange(selectedStudentIds.filter((sid) => sid !== id))
            }
          />
        ))}
      </div>
    </div>
  );
};
