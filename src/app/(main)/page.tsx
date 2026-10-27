import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Suspense } from 'react';

import ExamTypeRow, {
  ExamTypeRowSkeleton,
} from '@/components/tests/examTypeRow';
import HomeEmptyState from '@/components/tests/homeEmptyState';
import RowErrorBoundary from '@/components/tests/rowErrorBoundary';
import { EXAM_CLASSES, EXAM_TYPES } from '@/constants/exam';
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
      <div className="bg-surface flex flex-col gap-5 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold md:text-3xl">
            {profile
              ? t('home.greeting', { name: profile.firstName })
              : t('home.greetingFallback')}
          </h1>
          <p className="opacity-80">{t('home.subtitle')}</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {EXAM_TYPES.map((examType) => (
            <Link
              key={examType}
              href={buildTestsHref({ exam: examType })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 ${EXAM_CLASSES[examType].soft}`}
            >
              {t(`exam.${examType}`)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="bg-surface flex flex-col gap-8 rounded-3xl p-6 md:p-8">
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
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Home',
};
