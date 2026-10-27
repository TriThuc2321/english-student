import { Skeleton } from '@heroui/react';

import TestCardSkeleton from '@/components/tests/testCardSkeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <Skeleton className="h-10 w-full max-w-xl rounded-full" />
          <Skeleton className="h-10 w-full rounded-full sm:max-w-xs" />
        </div>
      </div>
      <Skeleton className="h-4 w-40 rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <TestCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
