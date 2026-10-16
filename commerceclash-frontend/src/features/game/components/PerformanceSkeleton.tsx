import { Skeleton } from "@/components/ui/skeleton";

export const PerformanceSkeleton = () => {
  return (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Top 3 podium skeletons */}
        <div className="flex items-end justify-center gap-3">
          <Skeleton className="h-32 w-24 bg-neutral-600 rounded-lg" />
          <Skeleton className="h-40 w-28 bg-neutral-600 rounded-lg" />
          <Skeleton className="h-32 w-24 bg-neutral-600 rounded-lg" />
        </div>

        {/* Rankings list skeletons */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-16 w-full bg-neutral-600 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};

