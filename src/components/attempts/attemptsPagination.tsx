'use client';

import PagePagination from '@/components/common/pagePagination';
import { ROUTES } from '@/constants/routes';

type AttemptsPaginationProps = { page: number; totalPages: number };

export default function AttemptsPagination(props: AttemptsPaginationProps) {
  return <PagePagination {...props} hrefFor={ROUTES.attempts} />;
}
