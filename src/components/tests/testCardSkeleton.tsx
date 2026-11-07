import { Skeleton } from '@heroui/react';

export default function TestCardSkeleton() {
  return (
    <div
      aria-hidden
      className="bg-surface shadow-surface flex h-52 flex-col gap-4 rounded-2xl p-5"
    >
      <Skeleton className="h-5 w-24 rounded-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-4/5 rounded" />
        <Skeleton className="h-3.5 w-2/5 rounded" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-auto h-3.5 w-full rounded" />
    </div>
  );
}
