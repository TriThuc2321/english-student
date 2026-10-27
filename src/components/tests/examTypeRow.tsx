import { Skeleton } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import type {
  ExamType,
  Paginated,
  StudentTestListItem,
} from '@/types/student-test';

import { EXAM_CLASSES } from '@/constants/exam';
import { buildTestsHref } from '@/lib/tests/catalogue-params';

import TestCard from './testCard';
import TestCardSkeleton from './testCardSkeleton';

type ExamTypeRowProps = {
  examType: ExamType;
  data: Promise<Paginated<StudentTestListItem>>;
};

const LIST_CLASS =
  '-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0';
const ITEM_CLASS = 'w-72 shrink-0 snap-start md:w-auto';

export default async function ExamTypeRow({
  examType,
  data,
}: ExamTypeRowProps) {
  const [{ data: tests }, t] = await Promise.all([data, getTranslations()]);
  if (tests.length === 0) return null;

  const headingId = `row-${examType}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="flex items-center gap-2.5 text-lg font-semibold"
        >
          <span
            aria-hidden
            className={`h-5 w-1.5 rounded-full ${EXAM_CLASSES[examType].bar}`}
          />
          {t(`exam.${examType}`)}
        </h2>
        <Link
          href={buildTestsHref({ exam: examType })}
          className="text-accent shrink-0 text-sm font-medium hover:underline"
        >
          {t('home.seeAll')}
        </Link>
      </div>
      <ul className={LIST_CLASS}>
        {tests.map((test) => (
          <li key={test.id} className={ITEM_CLASS}>
            <TestCard test={test} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExamTypeRowSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="h-6 w-48 rounded-lg" />
      <div className={LIST_CLASS}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={ITEM_CLASS}>
            <TestCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
