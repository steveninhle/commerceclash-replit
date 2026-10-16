import { StudentBadgeProps } from "@/components/types";

export const StudentBadge = ({
  student,
  onRemove,
  showRemoveButton = true,
}: StudentBadgeProps) => {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-[#2c2f31] border border-[#3a3d40] text-white">
      {student.name}
      {showRemoveButton && (
        <button
          type="button"
          onClick={() => onRemove(student.id)}
          aria-label={`Remove ${student.name}`}
          className="ml-0.5 text-gray-400 hover:text-red-400 transition-colors leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
};
