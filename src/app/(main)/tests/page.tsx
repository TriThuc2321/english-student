import type { Metadata } from 'next';

import { buttonVariants } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import ExamTypeTabs from '@/components/tests/examTypeTabs';
import TestCard from '@/components/tests/testCard';
import TestPagination from '@/components/tests/testPagination';
import TestSearch from '@/components/tests/testSearch';
import { ROUTES } from '@/constants/routes';
import { getStudentTests, TESTS_PAGE_SIZE } from '@/lib/api/student-tests';
import {
  buildTestsHref,
  parseCatalogueParams,
} from '@/lib/tests/catalogue-params';

export default async function TestsPage({ searchParams }: PageProps<'/tests'>) {
  const params = parseCatalogueParams(await searchParams);
  const [{ data, meta }, t] = await Promise.all([
    getStudentTests({
      examType: params.exam,
      search: params.q || undefined,
      page: params.page,
      take: TESTS_PAGE_SIZE,
    }),
    getTranslations('tests'),
  ]);

  const totalPages = Math.ceil(meta.totalCount / TESTS_PAGE_SIZE);
  if (data.length === 0 && meta.totalCount > 0) {
    redirect(buildTestsHref({ ...params, page: totalPages }));
  }

  const from = (params.page - 1) * TESTS_PAGE_SIZE + 1;
  const to = from + data.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold md:text-3xl">{t('title')}</h1>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ExamTypeTabs params={params} />
          <TestSearch params={params} />
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-lg font-semibold">{t('empty.title')}</h2>
          <Link
            href={ROUTES.TESTS}
            className={buttonVariants({ variant: 'secondary' })}
          >
            {t('empty.clear')}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm">
            {t('summary', { from, to, total: meta.totalCount })}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((test) => (
              <li key={test.id}>
                <TestCard test={test} />
              </li>
            ))}
          </ul>
          <TestPagination
            page={params.page}
            totalPages={totalPages}
            params={params}
          />
        </>
      )}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Tests',
};
