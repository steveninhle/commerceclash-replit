import { Skeleton } from "@/components/ui/skeleton";

export const SkillsSkeleton = () => {
  return (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header control skeleton */}
        <Skeleton className="h-12 w-full bg-neutral-600 rounded-lg" />

        {/* Student skill cards skeletons */}
        <div className="space-y-4 pt-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="space-y-2">
              {/* Student header */}
              <Skeleton className="h-8 w-full bg-neutral-600 rounded-lg" />
              {/* Skill card */}
              <Skeleton className="h-32 w-full bg-neutral-600 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

