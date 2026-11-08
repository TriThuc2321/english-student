import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 md:pt-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-4 w-40 rounded-lg" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
