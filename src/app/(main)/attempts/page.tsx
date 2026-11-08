import type { Metadata } from 'next';

import { buttonVariants, cn } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { IoTimeOutline } from 'react-icons/io5';

import AttemptRow from '@/components/attempts/attemptRow';
import PagePagination from '@/components/shared/pagePagination';
import { ROUTES } from '@/constants/routes';
import { ATTEMPTS_PAGE_SIZE, getMyAttempts } from '@/lib/api/attempts';
import {
  ATTEMPT_STATUSES,
  buildAttemptsHref,
  historyQuery,
  parseHistoryParams,
} from '@/lib/attempts/history-params';

export default async function AttemptsPage({
  searchParams,
}: PageProps<'/attempts'>) {
  const params = parseHistoryParams(await searchParams);
  const [{ data, meta }, t] = await Promise.all([
    getMyAttempts({
      status: params.status,
      page: params.page,
      take: ATTEMPTS_PAGE_SIZE,
    }),
    getTranslations(),
  ]);

  const totalPages = Math.ceil(meta.totalCount / ATTEMPTS_PAGE_SIZE);
  if (data.length === 0 && meta.totalCount > 0) {
    redirect(buildAttemptsHref({ ...params, page: totalPages }));
  }

  const from = (params.page - 1) * ATTEMPTS_PAGE_SIZE + 1;
  const to = from + data.length - 1;

  return (
    <div className="flex flex-col gap-6 md:pt-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t('attempts.title')}
        </h1>
        <p className="text-muted text-base">{t('attempts.subtitle')}</p>
      </div>
      <nav
        aria-label={t('attempts.statusFilter')}
        className="bg-default -mx-4 flex w-fit max-w-[calc(100%+2rem)] [scrollbar-width:none] gap-1 overflow-x-auto rounded-full p-1 md:mx-0 md:max-w-full"
      >
        {[undefined, ...ATTEMPT_STATUSES].map((status) => {
          const active = params.status === status;
          return (
            <Link
              key={status ?? 'all'}
              href={buildAttemptsHref({ status })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-8 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-surface text-foreground shadow-surface'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {status ? t(`attempts.status.${status}`) : t('attempts.all')}
            </Link>
          );
        })}
      </nav>
      {data.length === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
          <span
            aria-hidden
            className="bg-brand-navy-soft text-brand-navy flex size-14 items-center justify-center rounded-full"
          >
            <IoTimeOutline size={26} />
          </span>
          <h2 className="text-xl font-semibold">
            {params.status
              ? t('attempts.empty.filteredTitle')
              : t('attempts.empty.title')}
          </h2>
          <p className="text-muted max-w-md">
            {params.status
              ? t('attempts.empty.filteredDescription')
              : t('attempts.empty.description')}
          </p>
          <Link
            href={params.status ? ROUTES.ATTEMPTS : ROUTES.HOME}
            className={buttonVariants({ variant: 'secondary' })}
          >
            {params.status
              ? t('attempts.empty.clear')
              : t('attempts.empty.browse')}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted -mb-2 text-sm">
            {t('tests.summary', { from, to, total: meta.totalCount })}
          </p>
          <ul className="flex flex-col gap-3">
            {data.map((attempt) => (
              <li key={attempt.id}>
                <AttemptRow attempt={attempt} />
              </li>
            ))}
          </ul>
          <PagePagination
            page={params.page}
            totalPages={totalPages}
            pathname={ROUTES.ATTEMPTS}
            query={historyQuery(params)}
          />
        </>
      )}
    </div>
  );
}

export const metadata: Metadata = {
  title: 'My attempts',
};
