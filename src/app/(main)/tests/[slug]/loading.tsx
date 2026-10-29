import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-28 rounded-lg" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-5 w-72 rounded-lg" />
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
