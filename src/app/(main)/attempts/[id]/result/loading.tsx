import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-6 w-48 rounded-full" />
        <Skeleton className="h-9 w-3/4 rounded-lg" />
        <Skeleton className="h-5 w-64 rounded-lg" />
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 min-w-0 flex-[1_1_340px] rounded-xl" />
      </div>
    </div>
  );
}
