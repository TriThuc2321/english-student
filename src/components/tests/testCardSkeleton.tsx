import { Card, Skeleton } from '@heroui/react';

export default function TestCardSkeleton() {
  return (
    <Card className="h-full" aria-hidden>
      <Card.Header className="gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-2/5 rounded-lg" />
      </Card.Header>
      <Card.Content className="flex-row gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </Card.Content>
      <Card.Footer className="justify-between">
        <Skeleton className="h-3 w-12 rounded-lg" />
        <Skeleton className="h-3 w-28 rounded-lg" />
      </Card.Footer>
    </Card>
  );
}
