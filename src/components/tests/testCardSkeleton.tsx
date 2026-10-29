import { Skeleton } from '@heroui/react';

export default function TestCardSkeleton() {
  return (
    <div
      aria-hidden
      className="bg-surface border-border flex h-59 flex-col gap-3 rounded-xl border p-5"
    >
      <Skeleton className="h-4.5 w-24 rounded" />
      <Skeleton className="h-5.5 w-4/5 rounded" />
      <Skeleton className="h-3.5 w-2/5 rounded" />
      <div className="flex gap-1.5">
        <Skeleton className="h-6.5 w-25 rounded" />
        <Skeleton className="h-6.5 w-25 rounded" />
      </div>
      <Skeleton className="mt-auto h-3.5 w-full rounded" />
    </div>
  );
}
