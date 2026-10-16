import { Skeleton } from "@/components/ui/skeleton";

export function HeroCardSkeleton() {
  return (
    <div className="h-full w-full bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-12 w-full bg-neutral-600" />
          <Skeleton className="h-6 w-3/4 bg-neutral-600" />
          <Skeleton className="h-8 w-full bg-neutral-600 rounded-full" />
        </div>

        {/* Perk cards skeletons */}
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-20 w-full bg-neutral-600 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

