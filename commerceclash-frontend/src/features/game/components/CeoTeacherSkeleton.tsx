import { Skeleton } from "@/components/ui/skeleton";

export const CeoTeacherSkeleton = () => {
  return (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full space-y-3">
        {/* Student CEO assignment card skeletons */}
        {[1, 2, 3, 4, 5].map((index) => (
          <Skeleton
            key={index}
            className="h-24 w-full bg-neutral-600 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
};
