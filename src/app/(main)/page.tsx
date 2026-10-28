import type { Metadata } from 'next';

import { buttonVariants, cn } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IoBookOutline } from 'react-icons/io5';

import TestCard from '@/components/tests/testCard';
import TestPagination from '@/components/tests/testPagination';
import TestSearch from '@/components/tests/testSearch';
import { EXAM_TYPES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { getStudentTests, TESTS_PAGE_SIZE } from '@/lib/api/student-tests';
import {
  buildTestsHref,
  parseCatalogueParams,
} from '@/lib/tests/catalogue-params';

export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = parseCatalogueParams(await searchParams);
  const [{ data, meta }, t] = await Promise.all([
    getStudentTests({
      examType: params.exam,
      search: params.q || undefined,
      page: params.page,
      take: TESTS_PAGE_SIZE,
    }),
    getTranslations(),
  ]);

  const totalPages = Math.ceil(meta.totalCount / TESTS_PAGE_SIZE);
  if (data.length === 0 && meta.totalCount > 0) {
    redirect(buildTestsHref({ ...params, page: totalPages }));
  }

  const from = (params.page - 1) * TESTS_PAGE_SIZE + 1;
  const to = from + data.length - 1;
  const isFiltered = Boolean(params.exam || params.q);

  return (
    <div className="flex flex-col gap-6 md:pt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('tests.libraryTitle')}
          </h1>
          <p className="text-muted">{t('tests.subtitle')}</p>
        </div>
        <div className="w-full sm:w-96">
          <TestSearch params={params} />
        </div>
      </div>
      <nav
        aria-label={t('tests.examFilter')}
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0"
      >
        {[undefined, ...EXAM_TYPES].map((exam) => {
          const active = params.exam === exam;
          return (
            <Link
              key={exam ?? 'all'}
              href={buildTestsHref({ exam, q: params.q })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
                active
                  ? 'border-brand-navy bg-brand-navy text-brand-navy-foreground'
                  : 'border-separator bg-surface text-foreground hover:border-border hover:bg-surface-secondary',
              )}
            >
              {exam ? t(`exam.${exam}`) : t('tests.all')}
            </Link>
          );
        })}
      </nav>
      {data.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <span
            aria-hidden
            className="bg-brand-navy-soft text-brand-navy flex size-14 items-center justify-center rounded-full"
          >
            <IoBookOutline size={26} />
          </span>
          <h2 className="text-xl font-semibold">
            {isFiltered ? t('tests.empty.title') : t('tests.noTests.title')}
          </h2>
          <p className="text-muted max-w-md">
            {isFiltered
              ? t('tests.empty.description')
              : t('tests.noTests.description')}
          </p>
          {isFiltered && (
            <Link
              href={ROUTES.HOME}
              className={buttonVariants({ variant: 'secondary' })}
            >
              {t('tests.empty.clear')}
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted text-sm">
            {t('tests.summary', { from, to, total: meta.totalCount })}
          </p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-4">
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
  title: 'Test library',
};
