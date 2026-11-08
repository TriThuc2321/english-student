import type { Metadata } from 'next';

import { buttonVariants, cn } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IoBookOutline } from 'react-icons/io5';

import PagePagination from '@/components/shared/pagePagination';
import TestCard from '@/components/tests/testCard';
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
    <div className="flex flex-col gap-6 md:pt-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('tests.libraryTitle')}
        </h1>
        <p className="text-muted text-base">{t('tests.subtitle')}</p>
      </div>
      <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
        <nav
          aria-label={t('tests.examFilter')}
          className="bg-default -mx-4 flex w-fit max-w-[calc(100%+2rem)] [scrollbar-width:none] gap-1 overflow-x-auto rounded-full p-1 md:mx-0 md:max-w-full"
        >
          {[undefined, ...EXAM_TYPES].map((exam) => {
            const active = params.exam === exam;
            return (
              <Link
                key={exam ?? 'all'}
                href={buildTestsHref({ exam, q: params.q })}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-8 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-surface text-foreground shadow-surface'
                    : 'text-muted hover:text-foreground',
                )}
              >
                {exam ? t(`exam.${exam}`) : t('tests.all')}
              </Link>
            );
          })}
        </nav>
        <div className="w-full md:w-80">
          <TestSearch params={params} />
        </div>
      </div>
      {data.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
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
          <p className="text-muted -mb-2 text-sm">
            {t('tests.summary', { from, to, total: meta.totalCount })}
          </p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
            {data.map((test) => (
              <li key={test.id}>
                <TestCard test={test} />
              </li>
            ))}
          </ul>
          <PagePagination
            page={params.page}
            totalPages={totalPages}
            pathname={ROUTES.HOME}
            query={{
              ...(params.exam && { exam: params.exam }),
              ...(params.q && { q: params.q }),
            }}
          />
        </>
      )}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Test library',
};
