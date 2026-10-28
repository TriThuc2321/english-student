import { Skeleton } from '@heroui/react';

import TestCardSkeleton from '@/components/tests/testCardSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 md:pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-full sm:w-96" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-4 w-40 rounded-lg" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <TestCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
