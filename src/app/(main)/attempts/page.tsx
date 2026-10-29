import type { Metadata } from 'next';

import { buttonVariants } from '@heroui/react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LuHistory } from 'react-icons/lu';

import AttemptsPagination from '@/components/attempts/attemptsPagination';
import { AttemptsTable } from '@/components/attempts/attemptsTable';
import { ROUTES } from '@/constants/routes';
import { ATTEMPTS_PAGE_SIZE, getAttempts } from '@/lib/api/attempts';
import { parsePage } from '@/lib/tests/catalogue-params';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('attempts');
  return { title: t('title') };
}

export default async function AttemptsPage({
  searchParams,
}: PageProps<'/attempts'>) {
  const page = parsePage((await searchParams).page);
  const [{ data, meta }, t] = await Promise.all([
    getAttempts({ page, take: ATTEMPTS_PAGE_SIZE }),
    getTranslations('attempts'),
  ]);

  const totalPages = Math.ceil(meta.totalCount / ATTEMPTS_PAGE_SIZE);
  if (data.length === 0 && meta.totalCount > 0) {
    redirect(ROUTES.attempts(totalPages));
  }

  const from = (page - 1) * ATTEMPTS_PAGE_SIZE + 1;
  const to = from + data.length - 1;

  return (
    <div className="flex flex-col gap-6 md:pt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted">{t('subtitle')}</p>
      </div>
      {meta.totalCount === 0 ? (
        <div className="border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <span
            aria-hidden
            className="bg-brand-navy-soft text-brand-navy flex size-14 items-center justify-center rounded-full"
          >
            <LuHistory size={26} />
          </span>
          <h2 className="text-xl font-semibold">{t('empty.title')}</h2>
          <p className="text-muted max-w-md">{t('empty.description')}</p>
          <Link
            href={ROUTES.HOME}
            className={buttonVariants({ variant: 'primary' })}
          >
            {t('empty.browse')}
          </Link>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="attempts-table"
            className="bg-surface border-separator shadow-surface overflow-hidden rounded-3xl border"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-4">
              <h2 id="attempts-table" className="text-lg font-semibold">
                {t('tableTitle')}
              </h2>
              <p className="text-muted text-sm">
                {t('summary', { from, to, total: meta.totalCount })}
              </p>
            </div>
            <AttemptsTable attempts={data} />
          </section>
          <AttemptsPagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
