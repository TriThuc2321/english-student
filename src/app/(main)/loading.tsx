import { Skeleton } from '@heroui/react';

import { ExamTypeRowSkeleton } from '@/components/tests/examTypeRow';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <ExamTypeRowSkeleton />
      <ExamTypeRowSkeleton />
    </div>
  );
}
