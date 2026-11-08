'use client';

import { Pagination } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type PagePaginationProps = {
  page: number;
  totalPages: number;
  pathname: string;
  // Other params to keep (filters); `page` is added on top.
  query?: Record<string, string>;
};

function pageNumbers(page: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [1];
  if (page > 3) pages.push('ellipsis');
  for (
    let p = Math.max(2, page - 1);
    p <= Math.min(totalPages - 1, page + 1);
    p++
  ) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export default function PagePagination({
  page,
  totalPages,
  pathname,
  query = {},
}: PagePaginationProps) {
  const t = useTranslations('tests');
  const router = useRouter();

  if (totalPages <= 1) return null;

  const goTo = (target: number) => {
    const params = new URLSearchParams(query);
    if (target > 1) params.set('page', String(target));
    const search = params.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  };

  return (
    <Pagination aria-label={t('pagination')} className="justify-center">
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={page === 1}
            onPress={() => goTo(page - 1)}
          >
            <Pagination.PreviousIcon />
            <span>{t('previous')}</span>
          </Pagination.Previous>
        </Pagination.Item>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <Pagination.Item key={`ellipsis-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link isActive={p === page} onPress={() => goTo(p)}>
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next
            isDisabled={page === totalPages}
            onPress={() => goTo(page + 1)}
          >
            <span>{t('next')}</span>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
