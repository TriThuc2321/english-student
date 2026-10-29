'use client';

import PagePagination from '@/components/common/pagePagination';
import {
  buildTestsHref,
  type CatalogueParams,
} from '@/lib/tests/catalogue-params';

type TestPaginationProps = {
  page: number;
  totalPages: number;
  params: CatalogueParams;
};

export default function TestPagination({
  page,
  totalPages,
  params,
}: TestPaginationProps) {
  return (
    <PagePagination
      page={page}
      totalPages={totalPages}
      hrefFor={(target) => buildTestsHref({ ...params, page: target })}
    />
  );
}
