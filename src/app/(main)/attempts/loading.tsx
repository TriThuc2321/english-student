import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 md:pt-2">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-5 w-80 rounded-lg" />
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
