import type { ExamType } from '@/types/student-test';

import { isExamType } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';

export const SEARCH_MAX_LENGTH = 255;

export type CatalogueParams = {
  exam?: ExamType;
  q: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  return Math.max(Number(value), 1);
}

export function parseCatalogueParams(sp: SearchParams): CatalogueParams {
  const exam = first(sp.exam);
  return {
    exam: isExamType(exam) ? exam : undefined,
    q: (first(sp.q) ?? '').trim().slice(0, SEARCH_MAX_LENGTH),
    page: parsePage(first(sp.page)),
  };
}

export function buildTestsHref({ exam, q, page }: Partial<CatalogueParams>) {
  const params = new URLSearchParams();
  if (exam) params.set('exam', exam);
  if (q) params.set('q', q);
  if (page && page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${ROUTES.TESTS}?${query}` : ROUTES.TESTS;
}
