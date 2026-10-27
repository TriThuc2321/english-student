import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-40 rounded-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  );
}
