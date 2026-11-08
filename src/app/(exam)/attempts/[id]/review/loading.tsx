import { Skeleton } from '@heroui/react';

export default function Loading() {
  return (
    <div className="flex h-dvh flex-col gap-4 p-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="w-full flex-1 rounded-lg" />
    </div>
  );
}
