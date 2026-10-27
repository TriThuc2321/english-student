import type { Metadata } from 'next';

import { buttonVariants } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';

import ExamTypeRow, {
  ExamTypeRowSkeleton,
} from '@/components/tests/examTypeRow';
import HomeEmptyState from '@/components/tests/homeEmptyState';
import RowErrorBoundary from '@/components/tests/rowErrorBoundary';
import { EXAM_TYPES } from '@/constants/exam';
import { getProfile } from '@/lib/api/profile';
import { getStudentTests } from '@/lib/api/student-tests';
import { buildTestsHref } from '@/lib/tests/catalogue-params';

const ROW_SIZE = 4;

export default async function Home() {
  const rows = EXAM_TYPES.map((examType) => ({
    examType,
    data: getStudentTests({ examType, take: ROW_SIZE }),
  }));

  const [profile, t] = await Promise.all([
    getProfile().catch((error: unknown) => {
      unstable_rethrow(error);
      return null;
    }),
    getTranslations(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold md:text-3xl">
          {profile
            ? t('home.greeting', { name: profile.firstName })
            : t('home.greetingFallback')}
        </h1>
        <p className="text-muted">{t('home.subtitle')}</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {EXAM_TYPES.map((examType) => (
          <Link
            key={examType}
            href={buildTestsHref({ exam: examType })}
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            {t(`exam.${examType}`)}
          </Link>
        ))}
      </nav>
      {rows.map(({ examType, data }) => (
        <RowErrorBoundary key={examType} examType={examType}>
          <Suspense fallback={<ExamTypeRowSkeleton />}>
            <ExamTypeRow examType={examType} data={data} />
          </Suspense>
        </RowErrorBoundary>
      ))}
      <Suspense fallback={null}>
        <HomeEmptyState data={rows.map(({ data }) => data)} />
      </Suspense>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Home',
};
